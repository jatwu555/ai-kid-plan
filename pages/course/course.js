// pages/course/course.js —— 详情页逻辑：加载课程 + 滑动完成探索 + 完成/浏览记录
const { courses } = require('../../data/courses')
const { faceBotSvg } = require('../../utils/botIcon')
const LAST_READ_KEY = 'last_read_course'
const DONE_KEY = 'course_done_map' // 完成标记：{ 课程id: true }

// 「想一想：xxx」→ { verb: '想一想', rest: 'xxx' }；无冒号时动词置空
function splitVerb(text) {
  const i = String(text).indexOf('：')
  if (i > 0 && i <= 4) {
    return { verb: text.slice(0, i), rest: text.slice(i + 1) }
  }
  return { verb: '', rest: text }
}

// 统计已完成天数
function countDone() {
  const map = wx.getStorageSync(DONE_KEY) || {}
  return courses.filter(c => map[c.id]).length
}

Page({
  data: {
    course: {},   // 当前课程对象（taskContent 已拆分为 verb/rest）
    done: false,  // 本课是否已完成（完成后滑块锁定为绿色）
    dragging: false,
    slideX: 0,    // 滑块位移（px）
    maxSlide: 0,  // 滑块最大位移（px），onReady 里实测
    botFaceSrc: faceBotSvg(), // AI 小伙伴头像（SVG data URI）
    // 挑战完成弹窗
    showDonePop: false,   // 是否显示完成弹窗
    donePopin: false,     // 弹窗淡入动画标记（延时触发，保证过渡生效）
    completedDays: 0,     // 已完成天数
    totalDays: 5,         // 总天数（courses.length）
    popStars: []          // 弹窗进度星标 [true, true, false, false, false]
  },

  onLoad(options) {
    // 页面路径：/pages/course/course?id=1（id 缺省时兜底第 1 课）
    const id = Number(options.id) || courses[0].id
    this.showCourse(id)
  },

  onReady() {
    // 实测滑轨与滑块宽度，计算最大滑动距离
    const query = wx.createSelectorQuery()
    query.select('.slide-track').boundingClientRect()
    query.select('.slide-knob').boundingClientRect()
    query.exec(res => {
      const track = res && res[0]
      const knob = res && res[1]
      if (track && knob && knob.width > 0) {
        const margin = knob.left - track.left // 左右留白（px）
        const maxSlide = Math.max(0, track.width - knob.width - margin * 2)
        this.setData({
          maxSlide,
          slideX: this.data.done ? maxSlide : 0
        })
      }
    })
  },

  // 按 id 加载课程，读取完成状态并写入本地浏览记录
  showCourse(id) {
    const course = courses.find(c => c.id === id) || courses[0]
    const doneMap = wx.getStorageSync(DONE_KEY) || {}
    this.setData({
      course: {
        ...course,
        taskContent: (course.taskContent || []).map(splitVerb)
      },
      done: !!doneMap[course.id],
      slideX: 0
    })
    // 本地浏览记录：记录最近浏览的课程 ID（供首页「上次看到」标记）
    wx.setStorageSync(LAST_READ_KEY, course.id)
    // 导航栏标题同步为课程标题
    wx.setNavigationBarTitle({ title: `第 ${course.day} 天｜${course.title}` })
  },

  // ── 滑动完成今天的探索 ──
  onSlideStart(e) {
    if (this.data.done) return // 已完成后不可再拖动
    this._startX = e.touches[0].clientX
    this._dragging = true
    this.setData({ dragging: true })
  },

  onSlideMove(e) {
    if (this.data.done || !this._dragging) return
    const dx = e.touches[0].clientX - this._startX
    const x = Math.min(Math.max(0, dx), this.data.maxSlide)
    this.setData({ slideX: x })
  },

  onSlideEnd() {
    if (this.data.done || !this._dragging) return
    this._dragging = false
    this.setData({ dragging: false })
    // 滑过全程 80% 即确认完成，否则弹回起点
    if (this.data.maxSlide > 0 && this.data.slideX >= this.data.maxSlide * 0.8) {
      this.finishCourse()
    } else {
      this.setData({ slideX: 0 })
    }
  },

  // 标记完成：写入本地存储 + 震动反馈 + 滑块锁定到最右 + 弹出挑战完成弹窗
  finishCourse() {
    const map = wx.getStorageSync(DONE_KEY) || {}
    map[this.data.course.id] = true
    wx.setStorageSync(DONE_KEY, map)
    wx.vibrateShort({ type: 'light' })
    const completed = countDone()
    const total = courses.length
    // 进度星标：完成的前 completed 天点亮
    const popStars = courses.map((c, i) => i < completed)
    this.setData({
      done: true,
      slideX: this.data.maxSlide,
      completedDays: completed,
      totalDays: total,
      popStars,
      showDonePop: true
    })
    // 延时一帧触发淡入动画
    setTimeout(() => this.setData({ donePopin: true }), 60)
  },

  // 「先不晒」关闭弹窗（可从首页「继续学习」重新进入课程，但弹窗只在完成当次弹出）
  onCloseDonePop() {
    this.setData({ donePopin: false })
    setTimeout(() => this.setData({ showDonePop: false }), 220)
  },

  // 晒一晒：跳转挑战成功海报页（动态携带课程与进度）
  onSharePoster() {
    const c = this.data.course
    wx.navigateTo({
      url: `/pages/poster/poster?day=${c.day}&title=${encodeURIComponent(c.title)}&done=${this.data.completedDays}&total=${this.data.totalDays}`
    })
  },

  // 好友分享：邀请语 + 定向课程路径（右上角菜单与页面内分享按钮共用）
  onShareAppMessage() {
    const c = this.data.course
    if (this.data.done) {
      // 已完成：分享当前挑战成果
      return {
        title: `我在5天AI启蒙挑战完成了第${c.day}天！`,
        path: `/pages/index/index`,
        desc: '每天5分钟，和孩子一起认识AI'
      }
    }
    return {
      title: `第${c.day}天｜${c.title}`,
      path: `/pages/course/course?id=${c.id}`,
      desc: '每天5分钟，和孩子一起认识AI'
    }
  },

  // 阻止弹窗出现时底层页面滚动
  preventTouchMove() {}
})
