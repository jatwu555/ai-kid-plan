// pages/poster/poster.js —— 挑战完成分享页：完成反馈 / 海报预览 / 分享操作
// 海报为固定 3:4 比例的 WXML 版式，后续导出图片/保存相册可直接按该比例渲染
// 小程序码接入前使用确定性占位图（不出现开发态文案）；接入后替换 qrSrc 即可
const COURSE_TOTAL_FALLBACK = 5
const { svgToDataUri, fullBotSvg } = require('../../utils/botIcon')

// 生成二维码占位图：带定位角的确定性点阵，观感接近二维码但不可扫
function buildQrPlaceholder() {
  const N = 21
  const on = (r, c) => {
    const tl = r < 7 && c < 7
    const tr = r < 7 && c >= N - 7
    const bl = r >= N - 7 && c < 7
    if (tl || tr || bl) {
      const lr = tl || tr ? r : r - (N - 7)
      const lc = tl || bl ? c : c - (N - 7)
      const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
      return ring || core
    }
    if (r === 6 || c === 6) return (r + c) % 2 === 0
    return (r * 7 + c * 11 + ((r * c) % 7) * 3) % 5 < 2
  }
  let rects = ''
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (on(r, c)) rects += '<rect x="' + c + '" y="' + r + '" width="1" height="1"/>'
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + N + ' ' + N + '" shape-rendering="crispEdges">' +
    '<rect width="' + N + '" height="' + N + '" fill="#FFFFFF"/><g fill="#4A3F35">' + rects + '</g></svg>'
}

Page({
  data: {
    day: 1,
    title: '',
    done: 1,
    total: COURSE_TOTAL_FALLBACK,
    stars: [],            // [{ on: true }] 与 done 同源，保证星数与进度文案一致
    botSrc: fullBotSvg(), // 课程列表同款 AI 机器人（星星与二维码之间的完成氛围元素）
    qrSrc: svgToDataUri(buildQrPlaceholder()),
    showTimelineTip: false
  },

  onLoad(options) {
    const total = Math.max(1, Number(options.total) || COURSE_TOTAL_FALLBACK)
    // 数据一致性钳制：天数不越界；done 至少为 1（本次完成的那天），不超过 total
    const day = Math.min(Math.max(1, Number(options.day) || 1), total)
    const done = Math.min(Math.max(1, Number(options.done) || day), total)
    const title = decodeURIComponent(options.title || '') || '今天的 AI 小课堂'
    const stars = []
    for (let i = 0; i < total; i++) stars.push({ on: i < done })
    this.setData({ day, title, done, total, stars })
    // 朋友圈分享走官方菜单能力（基础库 ≥ 2.11.3）
    if (wx.showShareMenu) {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    }
  },

  // ── 分享 ──
  // 微信好友：button open-type=share 触发
  onShareAppMessage() {
    const { day, done, total } = this.data
    return {
      title: '我完成了「5天AI启蒙挑战」第' + day + '天！',
      desc: '已完成 ' + done + '/' + total + ' 天，每天5分钟，和孩子一起认识AI',
      path: '/pages/index/index'
    }
  },

  // 朋友圈：官方 shareTimeline 能力（右上角菜单单页模式）
  onShareTimeline() {
    const { day } = this.data
    return {
      title: '我完成了「5天AI启蒙挑战」第' + day + '天！',
      query: 'from=timeline'
    }
  },

  // 朋友圈按钮：能力受限时引导用户走右上角官方菜单
  onShareTimelineTap() {
    this.setData({ showTimelineTip: true })
  },

  onCloseTimelineTip() {
    this.setData({ showTimelineTip: false })
  },

  // ── 返回 ──
  // 返回课程：正常从详情页进入时直接回退；直接打开（无页面栈）时兜底到对应课程
  onBackCourse() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/course/course?id=' + this.data.day })
    })
  },

  preventTouchMove() {}
})
