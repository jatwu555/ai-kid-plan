# 和孩子一起认识 AI · 手机版网页

本目录是「5 天亲子 AI 启蒙陪伴计划」的 **纯静态手机版网页**（自同仓库的微信小程序移植），无后端、无构建步骤，随仓库 main 分支 push 自动发布到 GitHub Pages：

**线上地址：https://jatwu555.github.io/ai-kid-plan/**

## 本地运行

任选其一：

- 直接双击打开 `index.html`（纯前端、无跨域请求，file:// 也能跑）；
- 或起本地服务：`cd web && python3 -m http.server 8080`，浏览器打开 <http://127.0.0.1:8080>。

手机调试建议用服务方式，并用同一 Wi-Fi 下手机访问 `http://<电脑IP>:8080`。

## 目录结构

```
web/
├── index.html          # 入口（壳）
├── css/style.css       # 全局样式（自小程序 wxss 移植，rpx/2≈px）
├── js/data.js          # ★ 5 节课数据（课程内容/视频地址只改这里）
├── js/botIcon.js       # AI 小伙伴 SVG 形象生成器（自小程序移植）
├── js/qrcode.min.js    # 二维码库（qrcode-generator 1.4.4，MIT，本地内置）
├── js/app.js           # 路由 + 页面逻辑（首页/课程/海报）
└── assets/             # 弹窗插画、微信/朋友圈小图标
```

## 页面与路由（hash 路由，可直接分享深链）

| 页面 | 路由 | 说明 |
|---|---|---|
| 首页 | `#/` | 课程目录 + 家长须知弹窗 + 邀请朋友 |
| 课程详情 | `#/course/1` | 视频 + 重点笔记 + 亲子任务 + 滑动完成 |
| 完成海报 | `#/poster?day=1&title=…&done=1&total=5` | 3:4 海报 + 真二维码 + 分享 |

## 与小程序的功能对应

- 家长须知首用弹窗、底部「温馨提示」再次唤起：`localStorage.notice_confirmed`
- 「继续学习」标记：`localStorage.last_read_course`
- 滑动完成（拖过 80% 判定）+ 已完成绿色锁定 + 绿勾徽标：`localStorage.done_courses`
- 微信原生分享 → Web Share API（微信内置浏览器等不支持时自动降级为复制链接）
- 海报二维码：小程序里是占位图，网页版生成**真实二维码**，指向本网页地址，扫码即达

## 修改指南

- 改课程标题/任务/视频：`js/data.js`（与小程序 `data/courses.js` 字段一致，可两边同步改）
- 改主色/底色：`css/style.css` 顶部 `:root` 色板变量
- 改须知弹窗文案：`js/app.js` 的 `noticeModalHTML()`
- 部署：push 到 main 即自动发布（`.github/workflows/deploy-pages.yml`），也可在 GitHub Actions 页面手动触发

## 已覆盖的质量项

- 移动端优先 + 桌面端 480px 居中展示；safe-area 底部适配
- 视频移动端内联播放（playsinline / x5-playsinline），16:9 自适应
- 滑动完成用 Pointer Events + `touch-action: none`，拖动不误触页面滚动
- 弹窗打开时锁定背景滚动；非法课程 id 兜底第 1 课；海报参数越界钳制
- 分享按钮在无 Web Share 环境降级复制链接并 toast 提示；键盘可操作目录行（Enter/空格）
- 无外部运行时依赖（二维码库已本地内置），离线打开除视频外均可渲染
