// ========== XSS Prevention ==========
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== Data Layer with localStorage Persistence ==========
const STORE_KEY = 'platform_db_v2';
const SESSION_KEY = 'platform_session_v1';

function defaultDB() {
  return {
    categories: [
      { id: 1, name: '餐饮服务', icon: '🍜' },
      { id: 2, name: '零售导购', icon: '🛍️' },
      { id: 3, name: '活动协助', icon: '🎪' },
      { id: 4, name: '家教辅导', icon: '📚' },
      { id: 5, name: '配送物流', icon: '🚴' },
      { id: 6, name: '设计排版', icon: '🎨' },
      { id: 7, name: '技术支持', icon: '💻' },
      { id: 8, name: '其他兼职', icon: '📋' },
    ],

    users: [
      { id: 1, phone: '13800000001', password: '123456', role: 'student', name: '李同学', avatar: '李', university: '华中科技大学', major: '计算机科学', grade: '大三', creditScore: 95, createdAt: '2026-09-01',
        bio: '计算机大三在读，周末空闲时间充裕。有咖啡厅兼职经验，也做过小学家教。做事认真负责，学习能力强。', skills: ['Python', 'C++', 'Office', 'PS基础'], availableTime: '周六全天、周日全天', expectedSalary: '120-200元/天', preferredCategories: ['技术支持','餐饮服务','家教辅导'], achievements: ['firstJob','streak3','highRated'] },
      { id: 2, phone: '13800000002', password: '123456', role: 'student', name: '王同学', avatar: '王', university: '武汉大学', major: '软件工程', grade: '大二', creditScore: 90, createdAt: '2026-09-02',
        bio: '软件工程大二，性格开朗外向，擅长沟通。有零售导购经验，周末可全天兼职。', skills: ['Java', '沟通能力强', '收银'], availableTime: '周六全天', expectedSalary: '100-150元/天', preferredCategories: ['零售导购','活动协助'], achievements: ['firstJob'] },
      { id: 3, phone: '13900000001', password: '123456', role: 'merchant', name: '张老板', avatar: '张', merchantName: '蓝湾咖啡', merchantAddr: '大学城南路12号', creditScore: 92, createdAt: '2026-09-01',
        bio: '大学城周边经营咖啡厅3年，长期需要周末兼职帮手。老板人好，从不拖欠工资，包午餐。', skills: [], availableTime: '', expectedSalary: '', preferredCategories: [], achievements: ['verified','highRated'] },
      { id: 4, phone: '13900000002', password: '123456', role: 'merchant', name: '刘经理', avatar: '刘', merchantName: '万达广场HM专柜', merchantAddr: '光谷大道1号', creditScore: 88, createdAt: '2026-09-03',
        bio: '万达广场连锁品牌门店，周末客流大需要导购协助。提供系统培训，日结工资。', skills: [], availableTime: '', expectedSalary: '', preferredCategories: [], achievements: ['verified'] },
    ],
    nextUserId: 5,

    jobs: [
      { id: 1, merchantId: 3, merchantName: '蓝湾咖啡', title: '周末咖啡厅吧台助手', category: '餐饮服务', salary: '120元/天', salaryNum: 120, location: '大学城南区', distance: '0.8km', workTime: '周六、周日 9:00-17:00', duration: '8小时/天', headcount: 2, tags: ['包午餐','就近分配','无经验可'], status: 'open', urgent: false, views: 342, desc: '协助吧台制作饮品、收银、清洁台面，工作轻松。', requirement: '18-25岁，在校大学生，性格开朗，有服务意识。', benefits: '包午餐、交通补贴、表现优异者可长期合作。', createdAt: '2026-10-01' },
      { id: 2, merchantId: 4, merchantName: '万达广场HM专柜', title: '商场导购员（周末急招）', category: '零售导购', salary: '150元/天', salaryNum: 150, location: '万达广场', distance: '2.3km', workTime: '周六、周日 10:00-18:00', duration: '8小时/天', headcount: 3, tags: ['日结','急招','培训上岗'], status: 'open', urgent: true, views: 521, desc: '负责品牌服饰的展示、顾客引导、试衣协助。', requirement: '形象气质佳，有零售经验优先，无经验可培训。', benefits: '日结工资、员工折扣、弹性排班。', createdAt: '2026-10-02' },
      { id: 3, merchantId: 3, merchantName: '蓝湾咖啡', title: '小学英语家教（一对一）', category: '家教辅导', salary: '80元/小时', salaryNum: 80, location: '翠湖小区', distance: '1.5km', workTime: '周六 14:00-16:00', duration: '2小时/次', headcount: 1, tags: ['长期','薪资周结'], status: 'open', urgent: false, views: 287, desc: '辅导三年级学生英语，包括单词背诵、口语练习、阅读理解。', requirement: '英语四级以上，有耐心，师范类优先。', benefits: '薪资周结、可长期续约、可根据学生时间调整。', createdAt: '2026-10-03' },
      { id: 4, merchantId: 4, merchantName: '万达广场HM专柜', title: '展会布置与引导志愿者', category: '活动协助', salary: '130元/天', salaryNum: 130, location: '国际会展中心', distance: '3.2km', workTime: '周六 8:00-17:00', duration: '8小时/天', headcount: 10, tags: ['包餐','大巴接送'], status: 'open', urgent: false, views: 198, desc: '负责展位引导、签到登记、物料分发，工作轻松简单。', requirement: '沟通能力强，有志愿者经验优先。', benefits: '包午餐、大巴接送、志愿服务证明。', createdAt: '2026-10-04' },
      { id: 5, merchantId: 3, merchantName: '蓝湾咖啡', title: '周末外卖配送骑手', category: '配送物流', salary: '200元/天', salaryNum: 200, location: '大学城站点', distance: '0.5km', workTime: '周六、周日 11:00-19:00', duration: '8小时/天', headcount: 5, tags: ['日结','提供装备'], status: 'open', urgent: true, views: 612, desc: '负责大学城周边外卖配送，路线熟悉、单量稳定。', requirement: '自备电动车，有健康证，能熟练使用导航。', benefits: '日结工资、提供配送装备、高峰补贴。', createdAt: '2026-10-05' },
      { id: 6, merchantId: 4, merchantName: '万达广场HM专柜', title: '公众号图文排版设计', category: '设计排版', salary: '100元/篇', salaryNum: 100, location: '线上远程', distance: '0km', workTime: '周末灵活安排', duration: '按篇计', headcount: 2, tags: ['线上','灵活','长期'], status: 'open', urgent: false, views: 165, desc: '负责公众号推文的图文排版、配图设计，每周2-3篇。', requirement: '熟练使用PS/Canva，有排版经验，审美在线。', benefits: '线上办公、时间灵活、长期合作。', createdAt: '2026-10-06' },
      { id: 7, merchantId: 3, merchantName: '蓝湾咖啡', title: '奶茶店周末店员', category: '餐饮服务', salary: '110元/天', salaryNum: 110, location: '大学城步行街', distance: '0.6km', workTime: '周六、周日 12:00-20:00', duration: '8小时/天', headcount: 3, tags: ['包餐','就近','弹性'], status: 'open', urgent: false, views: 423, desc: '负责点单、制作饮品、收银、店面清洁。', requirement: '18-25岁，手脚麻利，有餐饮经验优先。', benefits: '包餐、员工饮品、就近分配、弹性排班。', createdAt: '2026-10-07' },
      { id: 8, merchantId: 4, merchantName: '万达广场HM专柜', title: 'IT展会技术支持助理', category: '技术支持', salary: '180元/天', salaryNum: 180, location: '国际会议中心', distance: '3.0km', workTime: '周六 8:30-17:30', duration: '8小时/天', headcount: 4, tags: ['技术类','包餐','证明'], status: 'open', urgent: false, views: 256, desc: '协助展位设备调试、Demo演示、技术答疑。', requirement: '计算机/电子相关专业，了解云计算/AI基础概念。', benefits: '包餐、技术峰会参与证明、拓展人脉。', createdAt: '2026-10-08' },
    ],
    nextJobId: 9,

    applications: [
      { id: 1, jobId: 1, studentId: 1, studentName: '李同学', jobTitle: '周末咖啡厅吧台助手', merchantId: 3, merchantName: '蓝湾咖啡', applyTime: '2026-10-08 14:23', status: 'accepted', statusText: '已录用' },
      { id: 2, jobId: 5, studentId: 1, studentName: '李同学', jobTitle: '周末外卖配送骑手', merchantId: 3, merchantName: '蓝湾咖啡', applyTime: '2026-10-07 09:15', status: 'pending', statusText: '待处理' },
      { id: 3, jobId: 3, studentId: 1, studentName: '李同学', jobTitle: '小学英语家教（一对一）', merchantId: 3, merchantName: '蓝湾咖啡', applyTime: '2026-10-05 20:30', status: 'completed', statusText: '已完成' },
      { id: 4, jobId: 2, studentId: 2, studentName: '王同学', jobTitle: '商场导购员（周末急招）', merchantId: 4, merchantName: '万达广场HM专柜', applyTime: '2026-10-06 10:00', status: 'accepted', statusText: '已录用' },
    ],
    nextAppId: 5,

    orders: [
      { id: 'ORD20261008', jobId: 1, jobTitle: '周末咖啡厅吧台助手', merchantId: 3, merchantName: '蓝湾咖啡', studentId: 1, studentName: '李同学', date: '2026-10-12', hours: 8, salary: 120, total: 960, status: 'ongoing', statusText: '进行中', rated: false },
      { id: 'ORD20261005', jobId: 3, jobTitle: '小学英语家教（一对一）', merchantId: 3, merchantName: '蓝湾咖啡', studentId: 1, studentName: '李同学', date: '2026-10-05', hours: 2, salary: 80, total: 160, status: 'completed', statusText: '已完成', rated: true },
      { id: 'ORD20261001', jobId: 7, jobTitle: '奶茶店周末店员', merchantId: 3, merchantName: '蓝湾咖啡', studentId: 1, studentName: '李同学', date: '2026-10-01', hours: 8, salary: 110, total: 880, status: 'completed', statusText: '已完成', rated: true },
      { id: 'ORD20261006', jobId: 2, jobTitle: '商场导购员（周末急招）', merchantId: 4, merchantName: '万达广场HM专柜', studentId: 2, studentName: '王同学', date: '2026-10-13', hours: 8, salary: 150, total: 1200, status: 'ongoing', statusText: '进行中', rated: false },
    ],

    ratings: [
      { id: 1, orderId: 'ORD20261005', fromId: 1, toId: 3, rating: 5, content: '老板人很好，准时结工资，推荐！', createdAt: '2026-10-06' },
      { id: 2, orderId: 'ORD20261001', fromId: 1, toId: 3, rating: 4, content: '工作轻松，就是高峰期有点忙。', createdAt: '2026-10-02' },
    ],
    nextRatingId: 3,

    notifications: [
      { id: 1, userId: 1, type: 'application', title: '投递成功', content: '「周末咖啡厅吧台助手」已提交投递', read: false, time: '2026-10-08 14:23' },
      { id: 2, userId: 1, type: 'order', title: '订单更新', content: '「周末咖啡厅吧台助手」订单已生成，请按时到岗', read: false, time: '2026-10-08 15:00' },
      { id: 3, userId: 3, type: 'application', title: '新投递', content: '李同学投递了「周末咖啡厅吧台助手」', read: false, time: '2026-10-08 14:23' },
    ],
    nextNotifId: 4,

    agentLogs: [
      { type: 'review', title: '岗位违规审核', desc: '「周末刷单兼职」涉嫌虚假招聘，已自动下线并通知发布者补充证明。', time: '10分钟前', icon: '🔍' },
      { type: 'complete', title: '信息自动补全', desc: '「IT展会技术支持助理」岗位描述补充了工作地点导航链接与交通指引。', time: '32分钟前', icon: '✨' },
      { type: 'recommend', title: '智能推荐增强', desc: '根据学生画像（计算机专业+周末空闲），推荐「IT展会技术支持助理」匹配度92%。', time: '1小时前', icon: '🎯' },
      { type: 'review', title: '岗位违规审核', desc: '「高薪日结刷量」薪资异常（>500元/天），标记待人工复核。', time: '2小时前', icon: '🔍' },
      { type: 'complete', title: '信息自动补全', desc: '「小学英语家教」自动补全技能要求标签：英语四级、耐心、口语流利。', time: '3小时前', icon: '✨' },
      { type: 'recommend', title: '智能推荐增强', desc: '根据历史投递偏好（餐饮服务类），推荐「奶茶店周末店员」匹配度88%。', time: '5小时前', icon: '🎯' },
    ],
    agentStats: { reviewed: 156, completed: 89, matched: 234 },
  };
}

// Load from localStorage or use defaults
function loadDB() {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  const db = defaultDB();
  saveDB(db);
  return db;
}

function saveDB(db) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch(e) {}
}

let DB = loadDB();

// ========== Auth ==========
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
}
function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role, name: user.name, avatar: user.avatar }));
  else localStorage.removeItem(SESSION_KEY);
}
function getCurrentUser() {
  const sess = getSession();
  if (!sess) return null;
  return DB.users.find(u => u.id === sess.id) || null;
}
function isLoggedIn() { return !!getSession(); }
function isStudent() { const u = getCurrentUser(); return u && u.role === 'student'; }
function isMerchant() { const u = getCurrentUser(); return u && u.role === 'merchant'; }

// ========== Validation ==========
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}
function validatePassword(pwd) {
  return pwd && pwd.length >= 6;
}
function checkDuplicateApplication(studentId, jobId) {
  return DB.applications.some(a => a.studentId === studentId && a.jobId === jobId);
}

// ========== Helpers ==========
function getJobById(id) { return DB.jobs.find(j => j.id === parseInt(id)); }
function categoryIcon(name) { return (DB.categories.find(c => c.name === name) || {}).icon || '📋'; }
function getUserApplications(studentId) { return DB.applications.filter(a => a.studentId === studentId); }
function getMerchantJobs(merchantId) { return DB.jobs.filter(j => j.merchantId === merchantId); }
function getMerchantApplications(merchantId) { return DB.applications.filter(a => a.merchantId === merchantId); }
function getUserOrders(userId) {
  const u = getCurrentUser();
  if (!u) return [];
  if (u.role === 'student') return DB.orders.filter(o => o.studentId === userId);
  return DB.orders.filter(o => o.merchantId === userId);
}
function getUserNotifications(userId) { return DB.notifications.filter(n => n.userId === userId); }
function getUnreadCount(userId) { return DB.notifications.filter(n => n.userId === userId && !n.read).length; }
function getRatingsForUser(userId) { return DB.ratings.filter(r => r.toId === userId); }
function getAvgRating(userId) {
  const rs = getRatingsForUser(userId);
  if (!rs.length) return 0;
  return Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10;
}

// ========== Achievement Definitions ==========
const ACHIEVEMENT_DEFS = {
  firstJob:    { icon: '🎉', name: '首次兼职', desc: '完成第一份兼职工作' },
  streak3:     { icon: '🔥', name: '三连周末', desc: '连续3周完成兼职' },
  highRated:   { icon: '⭐', name: '高评价用户', desc: '获得4星以上评价' },
  verified:    { icon: '✓',  name: '已认证', desc: '身份信息已认证' },
  jobMaster:   { icon: '🏆', name: '兼职达人', desc: '完成5份以上兼职' },
  activeUser:  { icon: '💬', name: '活跃用户', desc: '收到10条以上评价' },
  punctual:    { icon: '⏰', name: '准时达人', desc: '按时到岗，无迟到记录' },
  topEarn:     { icon: '💰', name: '小金库', desc: '累计收入超2000元' },
};

function getAchievementDef(key) { return ACHIEVEMENT_DEFS[key] || null; }

// ========== Profile Completeness ==========
function getProfileCompleteness(user) {
  if (!user) return 0;
  const fields = user.role === 'student'
    ? ['name','phone','university','major','grade','bio','skills','availableTime','expectedSalary','preferredCategories']
    : ['name','phone','merchantName','merchantAddr','bio'];
  let filled = 0;
  fields.forEach(f => {
    const v = user[f];
    if (Array.isArray(v) ? v.length > 0 : (v && v.toString().trim() && v !== '未填写')) filled++;
  });
  return Math.round((filled / fields.length) * 100);
}

// ========== Smart Match Score ==========
function getSmartMatchJobs(userId, limit) {
  const user = DB.users.find(u => u.id === userId);
  if (!user || user.role !== 'student') return [];
  const appliedIds = getUserApplications(userId).map(a => a.jobId);
  let jobs = DB.jobs.filter(j => j.status === 'open' && !appliedIds.includes(j.id));
  jobs = jobs.map(j => {
    let score = 50;
    if (user.preferredCategories && user.preferredCategories.includes(j.category)) score += 25;
    if (user.skills && j.tags) {
      const overlap = j.tags.filter(t => user.skills.some(s => t.includes(s) || s.includes(t)));
      score += overlap.length * 8;
    }
    const dist = parseFloat(j.distance);
    if (dist && dist < 2) score += 10;
    if (j.urgent) score += 5;
    return { ...j, matchScore: Math.min(score, 99) };
  });
  jobs.sort((a, b) => b.matchScore - a.matchScore);
  return jobs.slice(0, limit || 3);
}
