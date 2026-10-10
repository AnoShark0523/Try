// ========== Mock Data ==========
const DB = {
  categories: [
    { id: 1, name: "餐饮服务", icon: "🍜", count: 128 },
    { id: 2, name: "零售导购", icon: "🛍️", count: 96 },
    { id: 3, name: "活动协助", icon: "🎪", count: 72 },
    { id: 4, name: "家教辅导", icon: "📚", count: 154 },
    { id: 5, name: "配送物流", icon: "🚴", count: 89 },
    { id: 6, name: "设计排版", icon: "🎨", count: 45 },
    { id: 7, name: "技术支持", icon: "💻", count: 63 },
    { id: 8, name: "其他兼职", icon: "📋", count: 110 },
  ],

  jobs: [
    {
      id: 1, title: "周末咖啡厅吧台助手", merchant: "蓝湾咖啡",
      category: "餐饮服务", salary: "120元/天", salaryNum: 120,
      location: "大学城南区", distance: "0.8km", workTime: "周六、周日 9:00-17:00",
      duration: "8小时/天", headcount: 2, tags: ["包午餐", "就近分配", "无经验可"],
      status: "open", urgent: false, views: 342,
      desc: "协助吧台制作饮品、收银、清洁台面，工作轻松。",
      requirement: "18-25岁，在校大学生，性格开朗，有服务意识。",
      benefits: "包午餐、交通补贴、表现优异者可长期合作。",
    },
    {
      id: 2, title: "商场导购员（周末急招）", merchant: "万达广场HM专柜",
      category: "零售导购", salary: "150元/天", salaryNum: 150,
      location: "万达广场", distance: "2.3km", workTime: "周六、周日 10:00-18:00",
      duration: "8小时/天", headcount: 3, tags: ["日结", "急招", "培训上岗"],
      status: "open", urgent: true, views: 521,
      desc: "负责品牌服饰的展示、顾客引导、试衣协助。",
      requirement: "形象气质佳，有零售经验优先，无经验可培训。",
      benefits: "日结工资、员工折扣、弹性排班。",
    },
    {
      id: 3, title: "小学英语家教（一对一）", merchant: "个人雇主",
      category: "家教辅导", salary: "80元/小时", salaryNum: 80,
      location: "翠湖小区", distance: "1.5km", workTime: "周六 14:00-16:00",
      duration: "2小时/次", headcount: 1, tags: ["长期", "薪资周结"],
      status: "open", urgent: false, views: 287,
      desc: "辅导三年级学生英语，包括单词背诵、口语练习、阅读理解。",
      requirement: "英语四级以上，有耐心，师范类优先。",
      benefits: "薪资周结、可长期续约、可根据学生时间调整。",
    },
    {
      id: 4, title: "展会布置与引导志愿者", merchant: "国际会展中心",
      category: "活动协助", salary: "130元/天", salaryNum: 130,
      location: "国际会展中心", distance: "3.2km", workTime: "周六 8:00-17:00",
      duration: "8小时/天", headcount: 10, tags: ["包餐", "大巴接送"],
      status: "open", urgent: false, views: 198,
      desc: "负责展位引导、签到登记、物料分发，工作轻松简单。",
      requirement: "沟通能力强，有志愿者经验优先。",
      benefits: "包午餐、大巴接送、志愿服务证明。",
    },
    {
      id: 5, title: "周末外卖配送骑手", merchant: "美团专送大学城站",
      category: "配送物流", salary: "200元/天", salaryNum: 200,
      location: "大学城站点", distance: "0.5km", workTime: "周六、周日 11:00-19:00",
      duration: "8小时/天", headcount: 5, tags: ["日结", "提供装备"],
      status: "open", urgent: true, views: 612,
      desc: "负责大学城周边外卖配送，路线熟悉、单量稳定。",
      requirement: "自备电动车，有健康证，能熟练使用导航。",
      benefits: "日结工资、提供配送装备、高峰补贴。",
    },
    {
      id: 6, title: "公众号图文排版设计", merchant: "校园媒体工作室",
      category: "设计排版", salary: "100元/篇", salaryNum: 100,
      location: "线上远程", distance: "0km", workTime: "周末灵活安排",
      duration: "按篇计", headcount: 2, tags: ["线上", "灵活", "长期"],
      status: "open", urgent: false, views: 165,
      desc: "负责公众号推文的图文排版、配图设计，每周2-3篇。",
      requirement: "熟练使用PS/Canva，有排版经验，审美在线。",
      benefits: "线上办公、时间灵活、长期合作。",
    },
    {
      id: 7, title: "奶茶店周末店员", merchant: "喜茶大学城店",
      category: "餐饮服务", salary: "110元/天", salaryNum: 110,
      location: "大学城步行街", distance: "0.6km", workTime: "周六、周日 12:00-20:00",
      duration: "8小时/天", headcount: 3, tags: ["包餐", "就近", "弹性"],
      status: "open", urgent: false, views: 423,
      desc: "负责点单、制作饮品、收银、店面清洁。",
      requirement: "18-25岁，手脚麻利，有餐饮经验优先。",
      benefits: "包餐、员工饮品、就近分配、弹性排班。",
    },
    {
      id: 8, title: "IT展会技术支持助理", merchant: "华为云技术峰会",
      category: "技术支持", salary: "180元/天", salaryNum: 180,
      location: "国际会议中心", distance: "3.0km", workTime: "周六 8:30-17:30",
      duration: "8小时/天", headcount: 4, tags: ["技术类", "包餐", "证明"],
      status: "open", urgent: false, views: 256,
      desc: "协助展位设备调试、Demo演示、技术答疑。",
      requirement: "计算机/电子相关专业，了解云计算/AI基础概念。",
      benefits: "包餐、技术峰会参与证明、拓展人脉。",
    },
  ],

  applications: [
    { id: 1, jobId: 1, jobTitle: "周末咖啡厅吧台助手", merchant: "蓝湾咖啡", applyTime: "2026-10-08 14:23", status: "accepted", statusText: "已录用" },
    { id: 2, jobId: 5, jobTitle: "周末外卖配送骑手", merchant: "美团专送大学城站", applyTime: "2026-10-07 09:15", status: "pending", statusText: "待处理" },
    { id: 3, jobId: 3, jobTitle: "小学英语家教（一对一）", merchant: "个人雇主", applyTime: "2026-10-05 20:30", status: "completed", statusText: "已完成" },
  ],

  orders: [
    { id: "ORD20261008", jobId: 1, jobTitle: "周末咖啡厅吧台助手", merchant: "蓝湾咖啡", date: "2026-10-12", hours: 8, salary: 120, total: 960, status: "ongoing", statusText: "进行中" },
    { id: "ORD20261005", jobId: 3, jobTitle: "小学英语家教（一对一）", merchant: "个人雇主", date: "2026-10-05", hours: 2, salary: 80, total: 160, status: "completed", statusText: "已完成" },
    { id: "ORD20261001", jobId: 7, jobTitle: "奶茶店周末店员", merchant: "喜茶大学城店", date: "2026-10-01", hours: 8, salary: 110, total: 880, status: "completed", statusText: "已完成" },
  ],

  agentLogs: [
    { type: "review", title: "岗位违规审核", desc: "「周末刷单兼职」涉嫌虚假招聘，已自动下线并通知发布者补充证明。", time: "10分钟前", icon: "🔍" },
    { type: "complete", title: "信息自动补全", desc: "「IT展会技术支持助理」岗位描述补充了工作地点导航链接与交通指引。", time: "32分钟前", icon: "✨" },
    { type: "recommend", title: "智能推荐增强", desc: "根据学生画像（计算机专业+周末空闲），推荐「IT展会技术支持助理」匹配度92%。", time: "1小时前", icon: "🎯" },
    { type: "review", title: "岗位违规审核", desc: "「高薪日结刷量」薪资异常（>500元/天），标记待人工复核。", time: "2小时前", icon: "🔍" },
    { type: "complete", title: "信息自动补全", desc: "「小学英语家教」自动补全技能要求标签：英语四级、耐心、口语流利。", time: "3小时前", icon: "✨" },
    { type: "recommend", title: "智能推荐增强", desc: "根据历史投递偏好（餐饮服务类），推荐「奶茶店周末店员」匹配度88%。", time: "5小时前", icon: "🎯" },
  ],

  agentStats: { reviewed: 156, completed: 89, matched: 234 },
};

// ========== Helper ==========
function getJobById(id) { return DB.jobs.find(j => j.id === parseInt(id)); }
function categoryIcon(name) { return (DB.categories.find(c => c.name === name) || {}).icon || "📋"; }
