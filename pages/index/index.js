// pages/index/index.js —— 首页逻辑：须知弹窗（仅首次）+ 课程目录（含完成标记）+ 最近浏览标记
const { courses } = require('../../data/courses')
const { fullBotSvg } = require('../../utils/botIcon')
const NOTICE_KEY = 'notice_confirmed'  // 须知已确认标记
const LAST_READ_KEY = 'last_read_course' // 最近浏览课程 id
const DONE_KEY = 'course_done_map'     // 完成标记：{ 课程id: true }

// 目录数据：显式构建完整字段对象（兼容 iOS 部分基础库对展开运算符数据渲染不完整的问题）
const courseList = courses.map(c => ({
  id: c.id,
  day: c.day,
  num: String(c.day).padStart(2, '0'),
  title: c.title,
  desc: c.desc,
  done: false // 是否已完成学习（onShow 时按本地存储刷新）
}))

Page({
  data: {
    courses: courseList,
    showNotice: false, // 是否显示首次须知弹窗
    pressedId: null,   // 目录行按下态 id（touchstart 置入，touchend/touchcancel 复位）
    lastRead: null,    // { id, day, title } 上次看到的课程
    botSrc: fullBotSvg() // AI 小伙伴形象（SVG data URI）
  },

  onLoad() {
    // 首次使用弹须知；之后读取本地浏览记录
    const confirmed = wx.getStorageSync(NOTICE_KEY)
    if (!confirmed) {
      this.setData({ showNotice: true })
    }
    this.refreshStatus()
  },

  onShow() {
    // 从详情页返回时刷新「已完成」与「上次看到」标记
    this.refreshStatus()
  },

  // 读取本地存储：完成标记刷到目录行；浏览记录用于「上次看到」标记
  refreshStatus() {
    const doneMap = wx.getStorageSync(DONE_KEY) || {}
    this.setData({
      courses: courseList.map(c => ({ ...c, done: !!doneMap[c.id] })),
      lastRead: this.readLast()
    })
  },

  // 读取本地浏览记录 → 转成 { id, day, title }
  readLast() {
    const lastId = wx.getStorageSync(LAST_READ_KEY)
    if (!lastId) return null
    const course = courses.find(c => c.id === lastId)
    return course ? { id: course.id, day: course.day, title: course.title } : null
  },

  // 点击「知道了」：写入标记，之后不再弹出
  onKnowTap() {
    wx.setStorageSync(NOTICE_KEY, true)
    this.setData({ showNotice: false })
  },

  // 底部「温馨提示」入口：再次唤出家长须知弹窗（不影响「知道了」后不再自动弹出）
  onNoticeEntryTap() {
    this.setData({ showNotice: true })
  },

  // 点击课程行 → 跳转详情页
  onCourseTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course/course?id=${id}`
    })
  },

  // 目录行按下态：touchend 先于 tap 触发，进详情页前已复位，避免 navigateTo 后按下背景残留
  onRowPressStart(e) {
    this.setData({ pressedId: e.currentTarget.dataset.id })
  },

  onRowPressEnd() {
    if (this.data.pressedId !== null) {
      this.setData({ pressedId: null })
    }
  },

  // 邀请朋友一起学：微信原生好友分享（button open-type=share 触发）
  onShareAppMessage() {
    return {
      title: '和朋友一起学习ai，邀请他们接受挑战～',
      desc: '5天AI启蒙挑战，每天5分钟，和孩子一起认识AI',
      path: '/pages/index/index'
    }
  },

  // 阻止弹窗出现时底层页面滚动
  preventTouchMove() {}
})
