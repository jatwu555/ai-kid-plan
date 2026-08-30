// data/courses.js —— 5 节课本地数据（课程内容 + 云端视频地址 + 亲子化文案）
//
// 字段说明：
//  id           课程唯一标识（用于页面跳转与浏览记录）
//  day          第几天（1~5）
//  title        课程标题
//  subtitle     副标题（当前页面未展示，保留备用）
//  desc         首页目录的一句话描述
//  videoUrl     云端视频地址（https 直链，video 组件流式播放）
//  rememberToday「今天记住」亲子化文案（卡片标题为「今天认识一个新朋友」）
//  taskTitle    亲子任务区标题（按天定制，亲子对话感）
//  taskContent  亲子任务内容（数组；支持「动词：内容」格式，动词会渲染成小标签）
//  sayLine      「今天请孩子说一句」填空句（轻互动提示，不做输入/记录）
const courses = [
  {
    id: 1,
    day: 1,
    title: 'AI 到底是什么？',
    subtitle: 'AI 到底是什么？',
    desc: '认识 AI 能做什么、不能做什么',
    videoUrl: 'https://autoglm-agent.aminer.cn/auto_fly/9b69ce7b-bbae-4135-bd37-dbcc7771ed75/第一课.mp4',
    rememberToday: 'AI 是会学习的电脑帮手。很多事情它能帮忙，但它也不是「什么都会」哦！',
    taskTitle: '和爸爸妈妈一起聊聊',
    taskContent: [
      '想一想：你觉得哪些事情可以请 AI 帮忙？',
      '找一找：和爸爸妈妈一起找找，生活中哪里藏着 AI？'
    ],
    sayLine: '我觉得 AI 可以帮我 ______。'
  },
  {
    id: 2,
    day: 2,
    title: '怎么让 AI 更懂你？',
    subtitle: '怎么让 AI 更懂你？',
    desc: '学会把自己的想法说清楚',
    videoUrl: 'https://autoglm-agent.aminer.cn/auto_fly/0ecf101c-03c5-4bd2-89aa-9fe3b172b65d/第二课.mp4',
    rememberToday: '把想法说得越清楚，AI 就越懂你。说清楚一点，再具体一点！',
    taskTitle: '和爸爸妈妈一起试试',
    taskContent: [
      '向爸爸妈妈分享怎么让 AI 更懂我们',
      '找一个物品，把它的特征描述给 AI 作出一幅画'
    ],
    sayLine: '我想让 AI 画 ______，我把它的样子说清楚。'
  },
  {
    id: 3,
    day: 3,
    title: 'AI 说的一定对吗？',
    subtitle: 'AI 说的一定对吗？',
    desc: '学会判断 AI 的答案',
    videoUrl: 'https://autoglm-agent.aminer.cn/auto_fly/432eaced-faa3-4489-b90f-5c9ade05da69/第三课.mp4',
    rememberToday: 'AI 说的不一定都对。想一想、查一查，再相信它也不迟。',
    taskTitle: '和爸爸妈妈一起当小裁判',
    taskContent: [
      '向爸爸妈妈说说为什么 AI 也会犯错？',
      '试试问 AI 一个问题，然后判断答案是否有可疑的地方'
    ],
    sayLine: 'AI 说的话，我会先 ______ 再相信。'
  },
  {
    id: 4,
    day: 4,
    // 说明：需求文档里第 4 天的 title（什么是 agent）与首页列表文案（怎么让 AI 帮我们做事）
    // 不一致，此处采用「四、课程数据结构」中的标题；subtitle 原文疑似笔误（误抄第 3 天），已修正为与标题一致。
    title: '什么是 Agent？',
    subtitle: '什么是 Agent？',
    desc: '和 AI 一起完成一个任务',
    videoUrl: 'https://autoglm-agent.aminer.cn/auto_fly/e08bc4ed-f460-4a5e-ad2f-674f860ac528/第四课.mp4',
    rememberToday: 'Agent 不只会聊天，还能动手帮我们做事，像个能干的小帮手。',
    taskTitle: '和爸爸妈妈一起动手',
    taskContent: [
      '向爸爸妈妈说说 Agent 和聊天式 AI 有何不同',
      '和爸爸妈妈体验一下 Agent 做个小工具'
    ],
    sayLine: 'Agent 还可以帮我 ______。'
  },
  {
    id: 5,
    day: 5,
    title: '怎么安全使用 AI？',
    subtitle: '怎么安全使用 AI？',
    desc: '保护自己，也保护隐私',
    videoUrl: 'https://autoglm-agent.aminer.cn/auto_fly/2397fbda-8be0-4a92-8212-4917de815b12/第五课.mp4',
    rememberToday: '名字、住址、密码是小秘密，不能随便告诉 AI 哦！',
    taskTitle: '和爸爸妈妈一起聊聊',
    taskContent: [
      '爸爸妈妈提问，让小孩判断能不能发给 AI',
      '回顾全部内容，小朋友分享一下学到了哪些知识'
    ],
    sayLine: '发出去之前，我会先想想这是不是 ______。'
  }
]

module.exports = { courses }
