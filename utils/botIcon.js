// utils/botIcon.js —— AI 小伙伴形象（SVG data URI 生成器）
// 形象参考：珍珠白圆头 + 墨蓝面屏 + 荧光青笑眼笑嘴（发光）+ 天线顶球 + 侧耳青色光环 + 底部青蓝喷射悬浮
// 小程序 WXML 不支持内联 <svg>，统一用 background-image: url("data:image/svg+xml,...") 呈现

// URL 编码 svg 字符串（小程序 <image> 组件用 base64 data URI 兼容性最好）
// 小程序环境用 wx.arrayBufferToBase64；其他环境退回 URL 编码（preview 脚本用）
function svgToDataUri(svg) {
  if (typeof wx !== 'undefined' && wx && typeof wx.arrayBufferToBase64 === 'function') {
    const utf8 = unescape(encodeURIComponent(svg))
    const bytes = new Uint8Array(utf8.length)
    for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i)
    return 'data:image/svg+xml;base64,' + wx.arrayBufferToBase64(bytes.buffer)
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// 完整悬浮机器人（含喷射光流）—— 用于首页顶部
function fullBotSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  <defs>
    <radialGradient id="jet" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#CFF7FF" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#5ED4F3" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#5ED4F3" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ball" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#D9E2EC"/>
    </radialGradient>
    <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#DDE6EE"/>
    </linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14273B"/>
      <stop offset="100%" stop-color="#0A1626"/>
    </linearGradient>
  </defs>

  <!-- 喷射光流 -->
  <ellipse cx="100" cy="196" rx="30" ry="42" fill="url(#jet)"/>
  <ellipse cx="100" cy="184" rx="16" ry="22" fill="#BFF1FF" opacity="0.85"/>

  <!-- 天线 -->
  <rect x="97" y="8" width="6" height="22" rx="3" fill="#334E68"/>
  <circle cx="100" cy="10" r="9" fill="url(#ball)"/>

  <!-- 手臂：肩关节叠在身体边缘上，白色手臂从关节伸出，左右完全镜像 -->
  <g>
    <circle cx="72" cy="158" r="9" fill="#334E68"/>
    <circle cx="128" cy="158" r="9" fill="#334E68"/>
    <rect x="44" y="156" width="32" height="14" rx="7" fill="url(#shell)" transform="rotate(22 60 163)"/>
    <rect x="124" y="156" width="32" height="14" rx="7" fill="url(#shell)" transform="rotate(-22 140 163)"/>
    <circle cx="46" cy="174" r="7" fill="#334E68"/>
    <circle cx="154" cy="174" r="7" fill="#334E68"/>
  </g>

  <!-- 耳朵（青色光环） -->
  <circle cx="34" cy="96" r="15" fill="#E8EEF4"/>
  <circle cx="34" cy="96" r="8" fill="none" stroke="#38C6F4" stroke-width="4"/>
  <circle cx="166" cy="96" r="15" fill="#E8EEF4"/>
  <circle cx="166" cy="96" r="8" fill="none" stroke="#38C6F4" stroke-width="4"/>

  <!-- 头部（圆顶拱形） -->
  <path d="M100 34 C 148 34 172 62 172 100 C 172 130 148 148 100 148 C 52 148 28 130 28 100 C 28 62 52 34 100 34 Z" fill="url(#shell)"/>

  <!-- 面部屏幕（大圆角矩形，墨蓝） -->
  <rect x="46" y="58" width="108" height="76" rx="30" fill="url(#face)"/>

  <!-- 笑眼（倒 U 弧线，荧光青，底层宽描边模拟发光） -->
  <path d="M68 96 Q 76 82 84 96" fill="none" stroke="#3EE0F5" stroke-width="13" stroke-linecap="round" opacity="0.22"/>
  <path d="M68 96 Q 76 82 84 96" fill="none" stroke="#3EE0F5" stroke-width="7" stroke-linecap="round"/>
  <path d="M116 96 Q 124 82 132 96" fill="none" stroke="#3EE0F5" stroke-width="13" stroke-linecap="round" opacity="0.22"/>
  <path d="M116 96 Q 124 82 132 96" fill="none" stroke="#3EE0F5" stroke-width="7" stroke-linecap="round"/>

  <!-- 微笑（圆弧线，荧光青，发光） -->
  <path d="M84 112 Q 100 124 116 112" fill="none" stroke="#3EE0F5" stroke-width="11" stroke-linecap="round" opacity="0.22"/>
  <path d="M84 112 Q 100 124 116 112" fill="none" stroke="#3EE0F5" stroke-width="6" stroke-linecap="round"/>

  <!-- 身体（胶囊形）+ 胸口指示灯（与头部重叠衔接，消除断开感） -->
  <rect x="66" y="142" width="68" height="62" rx="30" fill="url(#shell)"/>
  <circle cx="100" cy="176" r="11" fill="#E8EEF4"/>
  <circle cx="100" cy="176" r="6" fill="none" stroke="#38C6F4" stroke-width="3.5"/>
</svg>`
  return svgToDataUri(svg)
}

// 头像版（头 + 天线，用于「今天认识一个新朋友」卡片）
function faceBotSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <radialGradient id="ball2" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#D9E2EC"/>
    </radialGradient>
    <linearGradient id="shell2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#DDE6EE"/>
    </linearGradient>
    <linearGradient id="face2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14273B"/>
      <stop offset="100%" stop-color="#0A1626"/>
    </linearGradient>
  </defs>
  <rect x="55" y="6" width="5" height="20" rx="2.5" fill="#334E68"/>
  <circle cx="57.5" cy="8" r="7" fill="url(#ball2)"/>
  <!-- 耳朵：一半露在头部外侧 -->
  <circle cx="16" cy="64" r="13" fill="#E8EEF4"/>
  <circle cx="16" cy="64" r="7" fill="none" stroke="#38C6F4" stroke-width="4"/>
  <circle cx="104" cy="64" r="13" fill="#E8EEF4"/>
  <circle cx="104" cy="64" r="7" fill="none" stroke="#38C6F4" stroke-width="4"/>
  <path d="M60 22 C 96 22 112 44 112 72 C 112 96 92 110 60 110 C 28 110 8 96 8 72 C 8 44 24 22 60 22 Z" fill="url(#shell2)"/>
  <rect x="22" y="44" width="76" height="54" rx="24" fill="url(#face2)"/>
  <!-- 笑眼（倒 U 弧线，荧光青，底层宽描边模拟发光） -->
  <path d="M40 76 Q 46 64 52 76" fill="none" stroke="#3EE0F5" stroke-width="11" stroke-linecap="round" opacity="0.22"/>
  <path d="M40 76 Q 46 64 52 76" fill="none" stroke="#3EE0F5" stroke-width="6" stroke-linecap="round"/>
  <path d="M68 76 Q 74 64 80 76" fill="none" stroke="#3EE0F5" stroke-width="11" stroke-linecap="round" opacity="0.22"/>
  <path d="M68 76 Q 74 64 80 76" fill="none" stroke="#3EE0F5" stroke-width="6" stroke-linecap="round"/>

  <!-- 微笑（圆弧线，荧光青，发光） -->
  <path d="M50 88 Q 60 97 70 88" fill="none" stroke="#3EE0F5" stroke-width="9" stroke-linecap="round" opacity="0.22"/>
  <path d="M50 88 Q 60 97 70 88" fill="none" stroke="#3EE0F5" stroke-width="5.5" stroke-linecap="round"/>
</svg>`
  return svgToDataUri(svg)
}

module.exports = { svgToDataUri, fullBotSvg, faceBotSvg }
