// app.js —— 手机版网页逻辑：hash 路由（首页 / 课程详情 / 完成海报）+ 本地进度 + 分享
// 自小程序 pages/index、pages/course、pages/poster 逻辑移植：
//   wx.navigateTo   → location.hash
//   wx.storage      → localStorage（notice_confirmed / last_read_course / done_courses）
//   滑动完成         → Pointer Events（拖过全程 80% 判定完成）
//   微信原生分享     → Web Share API，不支持时降级为复制链接
//   小程序码占位图   → 真实二维码（qrcode-generator，指向当前网页）
(function () {
  'use strict';

  var NOTICE_KEY = 'notice_confirmed';
  var LAST_READ_KEY = 'last_read_course';
  var DONE_KEY = 'done_courses';

  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  var internalNav = false; // 标记最近一次路由变化是否由页内跳转触发（用于返回键兜底）

  // ── 小工具 ──
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function store(key, val) {
    try {
      if (arguments.length === 1) {
        var raw = localStorage.getItem(key);
        return raw == null ? null : JSON.parse(raw);
      }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* 隐私模式等场景下静默降级 */ }
    return arguments.length === 1 ? null : undefined;
  }
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  function copyLink(url, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { showToast(okMsg); }, function () {
        showToast(legacyCopy(url) ? okMsg : '复制失败，请手动复制地址栏链接');
      });
    } else {
      showToast(legacyCopy(url) ? okMsg : '复制失败，请手动复制地址栏链接');
    }
  }
  // 分享：优先 Web Share API；不可用（如桌面 / 部分微信内核）时降级为复制链接
  function shareOrCopy(data, okMsg) {
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else {
      copyLink(data.url || siteUrl(), okMsg);
    }
  }
  function vibrate() {
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
  }
  function lockScroll(lock) {
    document.documentElement.classList.toggle('no-scroll', lock);
  }
  function siteUrl() {
    return location.origin + location.pathname;
  }
  function nav(hash) {
    if (location.hash === hash) { render(); return; }
    internalNav = true;
    location.hash = hash;
  }
  function goBack(fallbackHash) {
    if (internalNav && window.history.length > 1) {
      history.back(); // hashchange 会把 internalNav 复位
    } else {
      nav(fallbackHash);
    }
  }
  function setFavicon() {
    var link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = faceBotSvg();
    document.head.appendChild(link);
  }

  // ── 数据 ──
  function splitVerb(text) {
    var i = String(text).indexOf('：');
    if (i > 0 && i <= 4) return { verb: text.slice(0, i), rest: text.slice(i + 1) };
    return { verb: '', rest: text };
  }
  function getDoneMap() { return store(DONE_KEY) || {}; }
  function countDone() {
    var map = getDoneMap();
    var n = 0;
    COURSES.forEach(function (c) { if (map[c.id]) n++; });
    return n;
  }
  function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

  // ── 路由 ──
  function parseRoute() {
    var h = location.hash || '#/';
    var qIndex = h.indexOf('?');
    var path = qIndex >= 0 ? h.slice(0, qIndex) : h;
    var query = {};
    if (qIndex >= 0) {
      h.slice(qIndex + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent(kv.slice(1).join('=') || '');
      });
    }
    var m = path.match(/^#\/course\/(\d+)/);
    if (m) return { name: 'course', id: Number(m[1]) };
    if (path === '#/poster') return { name: 'poster', query: query };
    return { name: 'home' };
  }

  // ── 公共片段 ──
  function noticeModalHTML() {
    return '' +
      '<div class="mask" id="noticeModal">' +
        '<div class="sheet"><div class="sheet-panel">' +
          '<div class="sheet-head">' +
            '<div class="sheet-head-text">' +
              '<div class="sheet-eyebrow"><span class="eyebrow-heart"></span>给家长的小提醒</div>' +
              '<div class="sheet-title"><div>陪孩子一起</div><div>开启 <span class="title-accent">AI</span> 启蒙</div></div>' +
            '</div>' +
            '<img class="sheet-illus" src="assets/notice-illustration.jpg" alt="亲子共读插画">' +
          '</div>' +
          '<div class="notice-list">' +
            '<div class="notice-item"><span class="notice-icon notice-icon-family"></span><span class="notice-text">本内容适合 5-10 岁孩子使用，建议家长陪伴孩子一起探索、一起提问。</span></div>' +
            '<div class="notice-divider"></div>' +
            '<div class="notice-item"><span class="notice-icon notice-icon-safe"></span><span class="notice-text">适度的 AI 互动，可以帮助孩子练习表达、培养思考与逻辑。</span></div>' +
            '<div class="notice-divider"></div>' +
            '<div class="notice-item"><span class="notice-icon notice-icon-time"></span><span class="notice-text">也请您协助孩子合理安排使用时长，养成健康的屏幕使用习惯，让科技更好地陪伴成长。</span></div>' +
          '</div>' +
          '<div class="sheet-btn" id="noticeKnow" role="button" tabindex="0">知道了</div>' +
        '</div></div>' +
      '</div>';
  }
  function bindNoticeModal() {
    var modal = document.getElementById('noticeModal');
    if (!modal) return;
    lockScroll(true);
    document.getElementById('noticeKnow').addEventListener('click', function () {
      store(NOTICE_KEY, true);
      modal.remove();
      lockScroll(false);
    });
  }

  // ── 视图：首页 ──
  function renderHome() {
    document.title = '和孩子一起认识 AI';
    var doneMap = getDoneMap();
    var lastId = store(LAST_READ_KEY);

    var rows = COURSES.map(function (c) {
      var done = !!doneMap[c.id];
      var isCurrent = lastId === c.id;
      return '' +
        '<div class="toc-row' + (isCurrent ? ' is-current' : '') + '" data-id="' + c.id + '" role="button" tabindex="0" aria-label="第' + c.day + '天：' + esc(c.title) + '">' +
          '<div class="toc-num">' + pad(c.day) + '</div>' +
          '<div class="toc-main"><div class="toc-title-line">' +
            '<span class="toc-title' + (done ? ' is-done' : '') + '">' + esc(c.title) + '</span>' +
            (done ? '<span class="done-badge"><span class="done-check"></span></span>' : '') +
            (isCurrent && !done ? '<span class="now-tag">继续学习</span>' : '') +
          '</div><div class="toc-desc">' + esc(c.desc) + '</div></div>' +
          '<div class="toc-arrow">→</div>' +
        '</div>';
    }).join('');

    var showNotice = !store(NOTICE_KEY);

    app.innerHTML = '' +
      '<div class="page">' +
        '<div class="header"><div class="header-row">' +
          '<div class="header-text">' +
            '<div class="eyebrow">5 天启蒙计划</div>' +
            '<div class="title">和孩子一起认识 AI</div>' +
          '</div>' +
          '<img class="bot-img" src="' + fullBotSvg() + '" alt="AI 小伙伴">' +
        '</div></div>' +
        '<div class="toc">' + rows + '</div>' +
        '<div class="invite">' +
          '<div class="invite-text"><div class="invite-desc">和朋友一起学习ai，邀请他们接受挑战～</div></div>' +
          '<button class="invite-btn" id="inviteBtn" type="button">邀请朋友</button>' +
        '</div>' +
        '<div class="foot-row">' +
          '<span class="foot">适读 5～10 岁 · 请家长陪同一起使用</span>' +
          '<span class="notice-entry" id="noticeEntry" role="button" tabindex="0"><span class="notice-entry-heart"></span><span>温馨提示</span></span>' +
        '</div>' +
      '</div>' +
      (showNotice ? noticeModalHTML() : '');

    Array.prototype.forEach.call(app.querySelectorAll('.toc-row'), function (row) {
      row.addEventListener('click', function () {
        nav('#/course/' + row.getAttribute('data-id'));
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
      });
    });
    document.getElementById('inviteBtn').addEventListener('click', function () {
      shareOrCopy({
        title: '和朋友一起学习ai，邀请他们接受挑战～',
        text: '5天AI启蒙挑战，每天5分钟，和孩子一起认识AI',
        url: siteUrl()
      }, '链接已复制，去粘贴给朋友吧');
    });
    document.getElementById('noticeEntry').addEventListener('click', function () {
      app.insertAdjacentHTML('beforeend', noticeModalHTML());
      bindNoticeModal();
    });
    bindNoticeModal();
  }

  // ── 视图：课程详情 ──
  function openPoster(course) {
    nav('#/poster?day=' + course.day + '&title=' + encodeURIComponent(course.title) + '&done=' + Math.max(1, countDone()) + '&total=' + COURSES.length);
  }

  function renderCourse(id) {
    var course = COURSES.filter(function (c) { return c.id === id; })[0] || COURSES[0];
    document.title = '第 ' + course.day + ' 天｜' + course.title;
    store(LAST_READ_KEY, course.id);
    var done = !!getDoneMap()[course.id];

    var tasks = (course.taskContent || []).map(function (t) {
      var item = splitVerb(t);
      return '<div class="task-item"><div class="task-main">' +
        (item.verb ? '<span class="task-verb">' + esc(item.verb) + '</span>' : '') +
        '<span class="task-text">' + esc(item.rest) + '</span>' +
      '</div></div>';
    }).join('');

    app.innerHTML = '' +
      '<div class="page page-course">' +
        '<div class="nav-row">' +
          '<button class="back-btn" id="backBtn" type="button" aria-label="返回首页">‹</button>' +
          '<span class="nav-day">第 ' + course.day + ' 天 · 共 ' + COURSES.length + ' 天</span>' +
        '</div>' +
        '<div class="head"><div class="title">' + esc(course.title) + '</div></div>' +
        '<div class="video-wrap">' +
          '<video class="video" id="courseVideo" controls playsinline webkit-playsinline x5-playsinline preload="metadata" src="' + esc(course.videoUrl) + '"></video>' +
        '</div>' +
        '<div class="panel remember">' +
          '<div class="remember-top"><img class="bot-avatar" src="' + faceBotSvg() + '" alt="AI 小伙伴头像"><div class="panel-label">重点笔记</div></div>' +
          '<div class="remember-text">' + esc(course.rememberToday) + '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-label">' + esc(course.taskTitle) + '</div>' +
          tasks +
          '<div class="say-line"><div class="say-label">今天请孩子说一句</div><div class="say-text">' + esc(course.sayLine) + '</div></div>' +
        '</div>' +
        '<div class="slide-row">' +
          '<div class="slide-track' + (done ? ' is-done' : '') + '" id="slideTrack">' +
            '<div class="slide-text" id="slideText">' + (done ? '完成挑战啦～' : '滑动完成今天的学习') + '</div>' +
            '<div class="slide-knob' + (done ? ' is-locked' : '') + '" id="slideKnob">' + (done ? '<span class="knob-check"></span>' : '<span class="knob-arrow"></span>') + '</div>' +
          '</div>' +
          (done ? '<button class="reshare-btn" id="reshareBtn" type="button"><img class="reshare-ic" src="assets/icon-wechat-white.png" alt=""><span>分享</span></button>' : '') +
        '</div>' +
      '</div>';

    document.getElementById('backBtn').addEventListener('click', function () {
      goBack('#/');
    });
    var reshareBtn = document.getElementById('reshareBtn');
    if (reshareBtn) reshareBtn.addEventListener('click', function () { openPoster(course); });

    if (!done) bindSlide(course);
    else lockKnob(course);
  }

  // 滑动完成：Pointer Events，拖过全程 80% 判定完成；完成后滑轨变绿锁定并进入海报页
  function bindSlide(course) {
    var track = document.getElementById('slideTrack');
    var knob = document.getElementById('slideKnob');
    var text = document.getElementById('slideText');
    var done = false;
    var dragging = false;
    var startX = 0, x = 0, maxSlide = 0;

    function measure() {
      var margin = knob.offsetLeft;
      maxSlide = Math.max(0, track.clientWidth - knob.offsetWidth - margin * 2);
    }
    function setX(px) {
      x = clamp(px, 0, maxSlide);
      knob.style.transform = 'translateX(' + x + 'px)';
    }

    knob.addEventListener('pointerdown', function (e) {
      if (done) return;
      e.preventDefault();
      measure();
      dragging = true;
      startX = e.clientX - x;
      knob.classList.add('is-dragging');
      try { knob.setPointerCapture(e.pointerId); } catch (err) {}
    });
    knob.addEventListener('pointermove', function (e) {
      if (!dragging || done) return;
      setX(e.clientX - startX);
    });
    function endDrag() {
      if (!dragging || done) return;
      dragging = false;
      knob.classList.remove('is-dragging');
      if (maxSlide > 0 && x >= maxSlide * 0.8) {
        finish();
      } else {
        setX(0);
      }
    }
    knob.addEventListener('pointerup', endDrag);
    knob.addEventListener('pointercancel', endDrag);

    function finish() {
      var map = getDoneMap();
      map[course.id] = true;
      store(DONE_KEY, map);
      done = true;
      measure();
      knob.classList.add('is-locked');
      knob.style.transform = 'translateX(' + maxSlide + 'px)';
      knob.innerHTML = '<span class="knob-check"></span>';
      track.classList.add('is-done');
      text.textContent = '完成挑战啦～';
      vibrate();
      // 滑轨旁补一个「分享」按钮（与小程序完成态一致）
      track.insertAdjacentHTML('afterend',
        '<button class="reshare-btn" id="reshareBtn" type="button"><img class="reshare-ic" src="assets/icon-wechat-white.png" alt=""><span>分享</span></button>');
      document.getElementById('reshareBtn').addEventListener('click', function () { openPoster(course); });
      // 轻微停顿让完成反馈可见，再进入海报页
      setTimeout(function () { openPoster(course); }, 650);
    }
  }

  // 已完成态进入课程页时，滑块直接锁定到最右
  function lockKnob(course) {
    var track = document.getElementById('slideTrack');
    var knob = document.getElementById('slideKnob');
    requestAnimationFrame(function () {
      var margin = knob.offsetLeft;
      var maxSlide = Math.max(0, track.clientWidth - knob.offsetWidth - margin * 2);
      knob.style.transform = 'translateX(' + maxSlide + 'px)';
    });
  }

  // ── 视图：完成海报 ──
  function makeQrSvg(text) {
    try {
      if (typeof qrcode === 'function') {
        var qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      }
    } catch (e) {}
    return '';
  }

  function renderPoster(query) {
    var total = clamp(Number(query.total) || COURSES.length, 1, 99);
    var day = clamp(Number(query.day) || 1, 1, total);
    var done = clamp(Number(query.done) || day, 1, total);
    var title = query.title || '今天的 AI 小课堂';
    document.title = '挑战完成 🎉';

    var stars = '';
    for (var i = 0; i < total; i++) {
      var on = i < done;
      stars += '<span class="star' + (on ? ' on' : '') + '">' + (on ? '★' : '☆') + '</span>';
    }

    app.innerHTML = '' +
      '<div class="page page-poster">' +
        '<div class="done-head">' +
          '<div class="done-title-row"><span class="spark spark-l"></span><span class="done-title">挑战完成 🎉</span><span class="spark spark-r"></span></div>' +
          '<div class="done-sub">今天又和孩子一起认识了一点 AI</div>' +
        '</div>' +
        '<div class="poster"><div class="poster-inner">' +
          '<div class="poster-tag">每天 5 分钟，和孩子一起认识 AI</div>' +
          '<div class="poster-day">完成第 <span class="day-num">' + day + '</span> 天</div>' +
          '<div class="poster-course">《' + esc(title) + '》</div>' +
          '<div class="poster-progress">' + stars + '</div>' +
          '<img class="poster-bot" src="' + fullBotSvg() + '" alt="AI 小伙伴">' +
          '<div class="poster-qr" id="qrBox">' + makeQrSvg(siteUrl()) + '</div>' +
          '<div class="poster-qr-label">扫码一起认识 AI</div>' +
        '</div></div>' +
        '<div class="poster-hint">截图保存这张海报，把挑战成果分享给家人朋友</div>' +
        '<div class="share-bar">' +
          '<button class="share-btn main" id="shareMain" type="button"><img class="btn-ic" src="assets/icon-wechat-white.png" alt=""><span>分享给朋友</span></button>' +
          '<button class="share-btn sub" id="shareMoments" type="button"><img class="btn-ic" src="assets/icon-moments.png" alt=""><span>朋友圈</span></button>' +
        '</div>' +
        '<div class="back-row"><span class="back-link" id="backCourse" role="button" tabindex="0">返回课程</span></div>' +
      '</div>' +
      '<div class="mask" id="tlTip" hidden>' +
        '<div class="tl-tip">' +
          '<div class="tl-tip-title">分享到朋友圈</div>' +
          '<div class="tl-tip-text">先截图保存上面的挑战海报，再打开微信朋友圈发布图片，把挑战成果分享给朋友们。</div>' +
          '<div class="tl-tip-btn" id="tlTipOk" role="button" tabindex="0">我知道了</div>' +
        '</div>' +
      '</div>';

    document.getElementById('shareMain').addEventListener('click', function () {
      shareOrCopy({
        title: '我完成了「5天AI启蒙挑战」第' + day + '天！',
        text: '已完成 ' + done + '/' + total + ' 天，每天5分钟，和孩子一起认识AI',
        url: siteUrl()
      }, '链接已复制，去粘贴给朋友吧');
    });
    var tlTip = document.getElementById('tlTip');
    document.getElementById('shareMoments').addEventListener('click', function () {
      tlTip.hidden = false;
      lockScroll(true);
    });
    function closeTip() { tlTip.hidden = true; lockScroll(false); }
    document.getElementById('tlTipOk').addEventListener('click', closeTip);
    tlTip.addEventListener('click', function (e) { if (e.target === tlTip) closeTip(); });
    document.getElementById('backCourse').addEventListener('click', function () {
      goBack('#/course/' + day);
    });
  }

  // ── 渲染调度 ──
  function render() {
    internalNav = false;
    lockScroll(false);
    window.scrollTo(0, 0);
    var r = parseRoute();
    if (r.name === 'course') renderCourse(r.id);
    else if (r.name === 'poster') renderPoster(r.query);
    else renderHome();
  }

  window.addEventListener('hashchange', render);
  setFavicon();
  render();
})();
