# 5 天亲子 AI 启蒙陪伴计划 · 微信小程序 MVP

微信原生小程序（WXML / WXSS / JS / JSON），无后端、无用户体系、无支付，课程数据全部本地配置，可直接导入微信开发者工具运行。

## 快速运行

1. 下载安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版即可）。
2. 打开开发者工具 → 导入项目 → 选择本目录（`ai-kid-plan/`，即本 README 所在目录）。
3. AppID 选择「测试号」（或使用自己的 AppID）；项目配置已写在 `project.config.json`。
4. 点击「编译」，模拟器中即可预览：首页 → 首次弹出使用须知 → 点「知道了」→ 点课程卡片进入详情页。
5. 手机预览：工具栏「预览」扫码，真机上视频可正常播放。

## 项目结构

```
ai-kid-plan/
├── app.js                    # 小程序入口（MVP 无额外逻辑，预留 globalData）
├── app.json                  # 全局配置：页面注册 + 窗口底色/标题
├── app.wxss                  # 全局样式：奶油底色 + 基础排版
├── project.config.json       # 开发者工具项目配置（appid 为 touristappid 占位）
├── sitemap.json              # 微信索引规则
├── data/
│   └── courses.js            # ★ 5 节课本地 mock 数据（改课程内容/视频只动这个文件）
└── pages/
    ├── index/                # 首页：标题 + 5 节课卡片 + 首次须知弹窗 + 「上次看到」提示
    │   ├── index.wxml
    │   ├── index.wxss
    │   ├── index.js
    │   └── index.json
    ├── course/               # 课程详情页：视频 + 重点笔记 + 亲子任务 + 滑动完成探索
    │   ├── course.wxml
    │   ├── course.wxss
    │   ├── course.js
    │   └── course.json
    └── poster/               # 挑战完成分享页：完成反馈 + 3:4 海报预览 + 好友/朋友圈分享
        ├── poster.wxml
        ├── poster.wxss
        ├── poster.js
        └── poster.json
```

## 功能清单

| 功能 | 实现位置 |
|---|---|
| 家长须知弹窗（首用自动弹出；点「知道了」后不再自动弹出） | `pages/index` + 本地存储 `notice_confirmed` |
| 底部「温馨提示」入口，点击随时再次唤起弹窗 | `pages/index/index.wxml` 的 `notice-entry` + `onNoticeEntryTap` |
| 弹窗插画（设计稿裁切导出，约 52KB） | `assets/notice-illustration.jpg` |
| 5 节课目录列表 → 点击进详情 | `pages/index/index.wxml` `onCourseTap` |
| 视频展示区（video 组件） | `pages/course/course.wxml` |
| 「今天记住」一句话 | `data/courses.js` 的 `rememberToday` 字段 |
| 「亲子任务」任务卡片 | `data/courses.js` 的 `taskTitle / taskContent` |
| 上一课 / 下一课（第 1 课无上一课、第 5 课无下一课，禁用态） | `pages/course/course.js` `onPrevTap / onNextTap` |
| 返回首页 | 使用微信导航栏左上角返回箭头（页面栈为空时系统自动回首页） |
| 本地浏览记录 → 目录行内「上次看到」标记 | 本地存储 `last_read_course` |
| 挑战完成分享页（完成反馈 + 3:4 海报预览 + 分享） | `pages/poster`（课程完成弹窗「晒一晒」进入） |
| 分享给微信好友 | 详情页 `onShareAppMessage` + 海报页按钮 `open-type=share` |

## 视频播放（已接入云端）

当前 5 节课的 `videoUrl` 已指向云端 https 直链（video/mp4），video 组件流式播放，无需下载到本地：

1. 开发者工具：在「详情 → 本地设置」勾选**「不校验合法域名」**即可直接播放；
2. 真机预览：默认可播放（开发/体验版不受域名校验限制）；
3. **正式发布前**：把视频迁移到你自己的云存储（腾讯云 COS / 阿里云 OSS / 微信云存储），替换 `data/courses.js` 里的 `videoUrl`，并在微信公众平台「开发管理 → 开发设置 → 服务器域名」把视频域名加入 `downloadFile` 合法域名。

视频源文件备份在 `/Users/wjl/Desktop/课程视频/`（第一课～第五课.mp4，每集 84–118MB，2026-08-30 更新版）。

## 后续修改指南

### 想改什么 | 改哪里 |
|---|---|
| 课程标题 / 任务 / 「今天记住」文案 | `data/courses.js`（单文件集中管理） |
| 视频换源 / 新增课程视频 | `data/courses.js` 的 `videoUrl`（https 直链即可） |
| 新增第 6 天及以后课程 | `data/courses.js` 数组追加对象即可，首页目录、上一课/下一课边界自动适配 |
| 主色 / 底色 | 各页面 wxss 顶部的色板注释（赤陶橙 `#C25330` / 暖纸底 `#FAF6EF`） |
| 弹窗文案 | `pages/index/index.wxml` 底部弹窗区块 |
| 换弹窗插画 | 替换 `assets/notice-illustration.jpg`（建议宽 500px 左右、JPEG、100KB 内） |
| 接入正式小程序码 | 替换 `pages/poster/poster.js` 里 `qrSrc`（现为占位图），版式比例不动 |
| 小程序名称 / 导航栏标题 | `app.json` 的 `navigationBarTitleText`，及微信公众平台设置 |

## 已覆盖的质量项

- 家长须知弹窗阻止底层滚动（`catchtouchmove`），「知道了」后写入本地存储不再自动弹出；底部「温馨提示」可随时手动再次唤起
- 上一课/下一课禁用态（视觉置灰 + 逻辑层边界判断双保险）
- 非法课程 id 兜底到第 1 课
- 返回首页后自动刷新「上次看到」标记（`onShow` 重读本地存储）
- 目录行与「晒一晒」按钮的按下态由 touchstart/touchend 手动管理，规避 `bindtap` 内 `navigateTo` 导致的按下背景残留
- 大字号、大按钮、目录式排版，适合儿童与家长共同阅读
- iPhone / Android / iPad 模拟器分辨率均正常（rpx 自适应布局）

## 后续可迭代方向（建议）

1. **完成度系统**：本地记录每课「任务已完成」，首页卡片显示 ✅，提升亲子打卡动力。
2. **视频上线替换 + 封面图**：接入真实课程视频与封面海报，详情页更完整。
3. **订阅消息提醒**：每天固定时间提醒「今天的 5 分钟开始啦」（需家长授权一次）。
4. **AI 绘画任务工具化**：第 2 天任务「描述物品让 AI 画」可内嵌一个简单的图片生成页。
5. **数据埋点**：统计每课进入率、视频完播率、复制按钮点击率，验证内容吸引力。
