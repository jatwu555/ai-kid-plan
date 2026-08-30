// pages/poster/poster.js —— 挑战成功海报：Canvas 动态绘制 + 好友/朋友圈分享
// 海报内容全部动态：第 N 天 / 课程标题 / 已完成进度；小程序码未接入前画占位区域，不虚构二维码
const COURSE_TOTAL_FALLBACK = 5

Page({
  data: {
    day: 1,
    title: '',
    done: 1,
    total: COURSE_TOTAL_FALLBACK,
    posterImage: '',       // canvas 导出的海报临时图片路径
    showTimelineTip: false // 朋友圈分享引导弹层
  },

  onLoad(options) {
    const day = Number(options.day) || 1
    const title = decodeURIComponent(options.title || '')
    const done = Math.max(1, Number(options.done) || 1)
    const total = Number(options.total) || COURSE_TOTAL_FALLBACK
    this.setData({ day, title, done, total })
    // 打开朋友圈分享菜单（官方能力：基础库 ≥ 2.11.3，单页模式由微信托管）
    if (wx.showShareMenu) {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    }
    this.renderPoster()
  },

  // ── 海报绘制 ──
  renderPoster() {
    const query = wx.createSelectorQuery()
    query.select('#posterCanvas').fields({ node: true, size: true })
    query.exec(res => {
      const node = res && res[0]
      if (!node || !node.node) return
      const canvas = node.node
      const ctx = canvas.getContext('2d')
      const dpr = (wx.getSystemInfoSync().pixelRatio) || 2
      const W = 600
      const H = 960
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)
      this.drawPoster(ctx, W, H)
      wx.canvasToTempFilePath({
        canvas,
        success: res => this.setData({ posterImage: res.tempFilePath }),
        fail: () => {
          wx.showToast({ title: '海报生成失败', icon: 'none' })
        }
      })
    })
  },

  // 海报版式：米白底 + 橙色品牌 + 深棕文字 + 白色圆角卡片 + 预留小程序码占位
  drawPoster(ctx, W, H) {
    const { day, title, done, total } = this.data

    // 背景
    ctx.fillStyle = '#FAF6EF'
    ctx.fillRect(0, 0, W, H)

    // 顶部眉题
    ctx.textAlign = 'center'
    ctx.fillStyle = '#B5502C'
    ctx.font = '600 22px sans-serif'
    ctx.fillText('5 天 AI 启蒙挑战', W / 2, 92)

    // 主标题
    ctx.fillStyle = '#2E2822'
    ctx.font = '800 44px sans-serif'
    ctx.fillText('挑战成功', W / 2, 160)

    // 白色圆角卡片
    const cardX = 50
    const cardY = 210
    const cardW = W - 100
    const cardH = 560
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 28)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // 卡片内：课程信息
    ctx.fillStyle = '#8A7B6B'
    ctx.font = '400 24px sans-serif'
    ctx.fillText(`AI 启蒙 · 第 ${day} 天`, W / 2, 288)

    // 课程标题（过长自动缩字号）
    ctx.fillStyle = '#2E2822'
    let titleSize = 36
    ctx.font = `800 ${titleSize}px sans-serif`
    while (ctx.measureText(title).width > cardW - 80 && titleSize > 24) {
      titleSize -= 2
      ctx.font = `800 ${titleSize}px sans-serif`
    }
    ctx.fillText(title, W / 2, 352)

    // 主文案
    ctx.fillStyle = '#C25330'
    ctx.font = '700 28px sans-serif'
    ctx.fillText('我完成了今天的 AI 挑战！', W / 2, 424)

    // 进度星标：完成的天点亮，未完成描边
    const starY = 500
    const starGap = 64
    const startX = W / 2 - (total - 1) * starGap / 2
    for (let i = 0; i < total; i++) {
      this.drawStar(ctx, startX + i * starGap, starY, 20, i < done)
    }

    // 进度文字
    ctx.fillStyle = '#6E6153'
    ctx.font = '600 24px sans-serif'
    ctx.fillText(`已完成 ${done} / ${total} 天`, W / 2, 560)

    // 小程序码占位区域（未接入小程序码能力，不虚构二维码）
    const qrSize = 130
    const qrX = W / 2 - qrSize / 2
    const qrY = 600
    ctx.setLineDash([6, 5])
    ctx.strokeStyle = '#D8CDBB'
    ctx.lineWidth = 2
    this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 16)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#A2937F'
    ctx.font = '400 19px sans-serif'
    ctx.fillText('小程序码', W / 2, qrY + 58)
    ctx.fillText('发布后自动生成', W / 2, qrY + 86)
    ctx.fillStyle = '#8A7B6B'
    ctx.font = '400 20px sans-serif'
    ctx.fillText('微信搜索「孩子AI启蒙」', W / 2, qrY + qrSize + 36)

    // 卡片下方品牌文案
    ctx.fillStyle = '#2E2822'
    ctx.font = '700 26px sans-serif'
    ctx.fillText('每天5分钟，和孩子一起认识AI', W / 2, 836)
    ctx.fillStyle = '#C25330'
    ctx.font = '600 22px sans-serif'
    ctx.fillText('邀请你一起挑战', W / 2, 876)

    // 底部小字
    ctx.fillStyle = '#A2937F'
    ctx.font = '400 18px sans-serif'
    ctx.fillText('5 天 AI 启蒙挑战', W / 2, 928)
  },

  // 圆角矩形路径
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  },

  // 五角星：filled 实心金星，否则描边灰星
  drawStar(ctx, cx, cy, r, filled) {
    const spikes = 5
    const outerR = r
    const innerR = r * 0.42
    let rot = -Math.PI / 2
    const path = []
    for (let i = 0; i < spikes * 2; i++) {
      const rr = i % 2 === 0 ? outerR : innerR
      path.push([cx + rr * Math.cos(rot), cy + rr * Math.sin(rot)])
      rot += Math.PI / spikes
    }
    ctx.beginPath()
    path.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]))
    ctx.closePath()
    if (filled) {
      ctx.fillStyle = '#F0B63A'
      ctx.fill()
    } else {
      ctx.strokeStyle = '#E0D5C2'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
  },

  // ── 分享 ──
  // 微信好友：button open-type=share 触发
  onShareAppMessage() {
    const { day, done, total } = this.data
    return {
      title: `我完成了「5天AI启蒙挑战」第${day}天！`,
      desc: `已完成 ${done}/${total} 天，每天5分钟，和孩子一起认识AI`,
      path: '/pages/index/index'
    }
  },

  // 朋友圈：官方 shareTimeline 能力（右上角菜单单页模式）
  onShareTimeline() {
    const { day } = this.data
    return {
      title: `我完成了「5天AI启蒙挑战」第${day}天！`,
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
  onBackCourse() {
    wx.navigateBack()
  },

  onBackHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  preventTouchMove() {}
})
