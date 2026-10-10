// ========== Navigation ==========
function navigate(page, params) {
  // Auth guard
  const authPages = ['publish','applications','orders','profile','merchant','notifications'];
  if (authPages.includes(page) && !isLoggedIn()) {
    navigate('login');
    toast('请先登录');
    return;
  }
  // Role guard
  if (page === 'publish' && !isMerchant()) {
    toast('仅商家可发布岗位');
    navigate('jobs');
    return;
  }
  if (page === 'merchant' && !isMerchant()) {
    toast('仅商家可访问此页面');
    navigate('home');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.navbar nav a').forEach(a => a.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'home') renderHome();
  if (page === 'jobs') renderJobs();
  if (page === 'detail') renderDetail(params);
  if (page === 'publish') resetPublishForm();
  if (page === 'applications') renderApplications('all');
  if (page === 'orders') renderOrders();
  if (page === 'merchant') renderMerchantDashboard();
  if (page === 'agent') renderAgent();
  if (page === 'profile') renderProfile();
  if (page === 'notifications') renderNotifications();

  updateNavByRole();
}

// ========== Role-based Nav ==========
function updateNavByRole() {
  const u = getCurrentUser();
  const navPublish = document.getElementById('nav-publish');
  const navMerchant = document.getElementById('nav-merchant');
  const navProfile = document.getElementById('nav-profile');
  const navLogin = document.getElementById('nav-login');
  const navLogout = document.getElementById('nav-logout');
  const navApplications = document.getElementById('nav-applications');
  const navOrders = document.getElementById('nav-orders');

  if (navPublish) navPublish.style.display = isMerchant() ? '' : 'none';
  if (navMerchant) navMerchant.style.display = isMerchant() ? '' : 'none';
  if (navApplications) navApplications.style.display = isStudent() ? '' : 'none';
  if (navOrders) navOrders.style.display = u ? '' : 'none';
  if (navLogin) navLogin.style.display = u ? 'none' : '';
  if (navLogout) navLogout.style.display = u ? '' : 'none';

  if (u && navProfile) {
    navProfile.textContent = u.avatar + ' ' + u.name;
  }

  // notification badge
  const badge = document.getElementById('notif-badge');
  if (badge) {
    const cnt = u ? getUnreadCount(u.id) : 0;
    badge.textContent = cnt > 0 ? cnt : '';
    badge.style.display = cnt > 0 ? 'flex' : 'none';
  }
}

// ========== Toast ==========
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ========== Confirm Dialog ==========
function confirmDialog(msg, onConfirm) {
  const overlay = document.getElementById('confirm-overlay');
  document.getElementById('confirm-msg').textContent = msg;
  overlay.style.display = 'flex';
  const yes = document.getElementById('confirm-yes');
  const no = document.getElementById('confirm-no');
  const close = () => { overlay.style.display = 'none'; };
  yes.onclick = () => { close(); onConfirm(); };
  no.onclick = close;
}

// ========== Auth: Login ==========
function doLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const pwd = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.textContent = '';

  if (!phone) { err.textContent = '请输入手机号'; return; }
  if (!validatePhone(phone)) { err.textContent = '手机号格式不正确'; return; }
  if (!pwd) { err.textContent = '请输入密码'; return; }

  const user = DB.users.find(u => u.phone === phone);
  if (!user) { err.textContent = '该手机号未注册'; return; }
  if (user.password !== pwd) { err.textContent = '密码错误'; return; }

  setSession(user);
  saveDB(DB);
  toast('登录成功！欢迎回来，' + user.name);
  updateNavByRole();
  setTimeout(() => navigate('home'), 600);
}

// ========== Auth: Register ==========
function doRegister() {
  const phone = document.getElementById('reg-phone').value.trim();
  const pwd = document.getElementById('reg-password').value;
  const pwd2 = document.getElementById('reg-password2').value;
  const name = document.getElementById('reg-name').value.trim();
  const role = document.querySelector('input[name="reg-role"]:checked');
  const err = document.getElementById('reg-error');
  err.textContent = '';

  if (!phone) { err.textContent = '请输入手机号'; return; }
  if (!validatePhone(phone)) { err.textContent = '手机号格式不正确（11位，1开头）'; return; }
  if (DB.users.some(u => u.phone === phone)) { err.textContent = '该手机号已注册'; return; }
  if (!validatePassword(pwd)) { err.textContent = '密码至少6位'; return; }
  if (pwd !== pwd2) { err.textContent = '两次密码不一致'; return; }
  if (!name) { err.textContent = '请输入姓名'; return; }
  if (!role) { err.textContent = '请选择身份'; return; }

  const user = {
    id: DB.nextUserId++,
    phone, password: pwd, role: role.value,
    name, avatar: name[0],
    university: '', major: '', grade: '',
    merchantName: '', merchantAddr: '',
    creditScore: 100,
    createdAt: new Date().toLocaleDateString('zh-CN'),
    bio: '', skills: [], availableTime: '', expectedSalary: '', preferredCategories: [], achievements: [],
  };
  if (role.value === 'student') {
    user.university = document.getElementById('reg-university').value.trim() || '未填写';
    user.major = document.getElementById('reg-major').value.trim() || '未填写';
    user.grade = document.getElementById('reg-grade').value.trim() || '未填写';
  } else {
    user.merchantName = document.getElementById('reg-merchant-name').value.trim() || name;
    user.merchantAddr = document.getElementById('reg-merchant-addr').value.trim() || '未填写';
  }
  DB.users.push(user);
  saveDB(DB);
  setSession(user);
  toast('注册成功！欢迎加入');
  updateNavByRole();
  setTimeout(() => navigate('home'), 600);
}

function toggleRegFields() {
  const role = document.querySelector('input[name="reg-role"]:checked');
  if (!role) return;
  const stuFields = document.getElementById('reg-student-fields');
  const merFields = document.getElementById('reg-merchant-fields');
  stuFields.style.display = role.value === 'student' ? '' : 'none';
  merFields.style.display = role.value === 'merchant' ? '' : 'none';
}

function logout() {
  setSession(null);
  toast('已退出登录');
  updateNavByRole();
  setTimeout(() => navigate('home'), 300);
}

// ========== Render: Home ==========
function renderHome() {
  const catGrid = document.getElementById('category-grid');
  if (!catGrid) return;
  catGrid.innerHTML = DB.categories ? DB.categories.map(c => {
    const count = DB.jobs.filter(j => j.category === c.name && j.status === 'open').length;
    return `<div class="category-card" onclick="navigate('jobs')">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-name">${esc(c.name)}</div>
      <div class="cat-count">${count}个岗位</div>
    </div>`;
  }).join('') : '';

  const hotJobs = document.getElementById('hot-jobs');
  if (hotJobs) hotJobs.innerHTML = DB.jobs.slice(0, 4).map(jobCardHTML).join('');
}

// ========== Render: Jobs ==========
function renderJobs() {
  const searchEl = document.getElementById('job-search');
  const catEl = document.getElementById('filter-category');
  const sortEl = document.getElementById('filter-sort');
  const search = (searchEl?.value || '').toLowerCase();
  const cat = catEl?.value || '';
  const sort = sortEl?.value || 'default';

  let jobs = DB.jobs.filter(j => j.status === 'open' || j.status === 'urgent');
  if (search) jobs = jobs.filter(j => j.title.toLowerCase().includes(search) || j.merchantName.toLowerCase().includes(search));
  if (cat) jobs = jobs.filter(j => j.category === cat);
  if (sort === 'salary-desc') jobs.sort((a, b) => b.salaryNum - a.salaryNum);
  if (sort === 'distance-asc') jobs.sort((a, b) => {
    const da = parseFloat(a.distance) || 999;
    const db = parseFloat(b.distance) || 999;
    return da - db;
  });

  const list = document.getElementById('job-list');
  if (!list) return;
  if (jobs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>未找到匹配的岗位</p></div>';
    return;
  }
  list.innerHTML = jobs.map(jobCardHTML).join('');
}

function initFilters() {
  const sel = document.getElementById('filter-category');
  if (sel && sel.options.length <= 1) {
    DB.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name; opt.textContent = c.name;
      sel.appendChild(opt);
    });
  }
}

// ========== Job Card HTML ==========
function jobCardHTML(j) {
  const statusClass = j.urgent ? 'status-urgent' : 'status-open';
  const statusText = j.urgent ? '急招' : '招聘中';
  return `<div class="job-card" onclick="navigate('detail', ${j.id})">
    <div class="job-header">
      <div class="job-title">${esc(j.title)}</div>
      <div class="job-salary">${esc(j.salary)}</div>
    </div>
    <div class="job-meta">
      <span>📍 ${esc(j.location)} (${esc(j.distance)})</span>
      <span>⏰ ${esc(j.workTime)}</span>
      <span>👥 招${j.headcount}人</span>
    </div>
    <div class="job-tags">${(j.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="job-footer">
      <div class="merchant-info">
        <div class="merchant-avatar">${esc((j.merchantName||j.merchant||'?')[0])}</div>
        <span>${esc(j.merchantName||j.merchant||'')}</span>
      </div>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
  </div>`;
}

// ========== Render: Detail ==========
function renderDetail(jobId) {
  const j = getJobById(jobId);
  const el = document.getElementById('detail-content');
  if (!el) return;
  if (!j) { el.innerHTML = '<p>岗位不存在</p>'; return; }
  j.views = (j.views||0) + 1;
  saveDB(DB);

  const avgRating = getAvgRating(j.merchantId);
  const ratingStars = avgRating > 0 ? '⭐'.repeat(Math.round(avgRating)) + ' ' + avgRating : '暂无评价';
  const alreadyApplied = isLoggedIn() && isStudent() && checkDuplicateApplication(getCurrentUser().id, j.id);

  el.innerHTML = `
    <div class="detail-header">
      <h1>${esc(j.title)}</h1>
      <div class="salary">${esc(j.salary)}</div>
      <div class="meta-row">
        <span>📍 ${esc(j.location)} (${esc(j.distance)})</span>
        <span>⏰ ${esc(j.workTime)}</span>
        <span>⏳ ${esc(j.duration)}</span>
        <span>👥 招${j.headcount}人</span>
        <span>👁️ ${j.views}浏览</span>
      </div>
      <div class="job-tags">${(j.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="merchant-info" style="margin-top:12px">
        <div class="merchant-avatar">${esc((j.merchantName||'?')[0])}</div>
        <div>
          <div style="font-weight:600">${esc(j.merchantName)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${ratingStars}</div>
        </div>
      </div>
    </div>
    <div class="detail-body">
      <h3>岗位描述</h3><p>${esc(j.desc)}</p>
      <h3>任职要求</h3><p>${esc(j.requirement)}</p>
      <h3>福利待遇</h3><p>${esc(j.benefits)}</p>
    </div>
    <div class="detail-actions">
      ${alreadyApplied
        ? '<button class="btn-primary" disabled style="opacity:0.6;cursor:not-allowed">已投递</button>'
        : isStudent()
          ? `<button class="btn-primary" onclick="applyJob(${j.id})">立即投递</button>`
          : isLoggedIn()
            ? '<span style="color:var(--text-muted)">商家账号无法投递岗位</span>'
            : `<button class="btn-primary" onclick="navigate('login')">登录后投递</button>`}
      <button class="btn-outline" onclick="navigate('jobs')">返回列表</button>
    </div>`;
}

// ========== Apply ==========
function applyJob(jobId) {
  if (!isLoggedIn()) { navigate('login'); return; }
  if (!isStudent()) { toast('仅学生可投递岗位'); return; }
  const user = getCurrentUser();
  if (checkDuplicateApplication(user.id, jobId)) { toast('您已投递过该岗位，请勿重复投递'); return; }
  const j = getJobById(jobId);
  if (!j) { toast('岗位不存在'); return; }

  DB.applications.unshift({
    id: DB.nextAppId++,
    jobId, studentId: user.id, studentName: user.name,
    jobTitle: j.title, merchantId: j.merchantId, merchantName: j.merchantName,
    applyTime: new Date().toLocaleString('zh-CN'),
    status: 'pending', statusText: '待处理',
  });
  DB.notifications.push({
    id: DB.nextNotifId++, userId: user.id, type: 'application',
    title: '投递成功', content: '「' + j.title + '」已提交投递', read: false,
    time: new Date().toLocaleString('zh-CN'),
  });
  DB.notifications.push({
    id: DB.nextNotifId++, userId: j.merchantId, type: 'application',
    title: '新投递', content: user.name + '投递了「' + j.title + '」', read: false,
    time: new Date().toLocaleString('zh-CN'),
  });
  saveDB(DB);
  toast('投递成功！等待商家确认');
  updateNavByRole();
  setTimeout(() => navigate('applications'), 1000);
}

// ========== Publish ==========
let publishTimer = null;
function resetPublishForm() {
  document.querySelectorAll('#page-publish input, #page-publish textarea').forEach(el => {
    if (el.id !== 'pub-headcount') el.value = '';
  });
  document.getElementById('pub-headcount').value = '1';
  ['hint-title','hint-location','hint-tags','hint-desc','pub-violation'].forEach(hideHint);
}
function onPublishInput() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(agentPublishAssist, 800);
}
function agentPublishAssist() {
  const title = document.getElementById('pub-title').value.trim();
  const location = document.getElementById('pub-location').value.trim();
  const tags = document.getElementById('pub-tags').value.trim();
  const desc = document.getElementById('pub-desc').value.trim();
  const salary = document.getElementById('pub-salary').value.trim();

  if (title && title.length < 5)
    showHint('hint-title', 'Agent建议：标题可补充具体岗位类型，如「周末咖啡厅吧台助手-包午餐」');
  else hideHint('hint-title');

  if (location && location.length < 3)
    showHint('hint-location', 'Agent建议：补充具体路段或地标，方便学生定位');
  else hideHint('hint-location');

  if (tags && tags.split(',').length < 2)
    showHint('hint-tags', 'Agent建议：添加2-3个标签提升曝光，如「包餐,就近,日结」');
  else hideHint('hint-tags');

  if (desc && desc.length < 10) {
    showHint('hint-desc', 'Agent建议：描述可补充具体工作流程，帮助学生快速了解');
  } else if (desc && desc.length >= 10) {
    const completed = agentAutoComplete(desc, title);
    if (completed) showHint('hint-desc', 'Agent已自动补全：' + completed);
    else hideHint('hint-desc');
  } else hideHint('hint-desc');

  if (salary) {
    const num = parseInt(salary);
    if (num > 500) showHint('pub-violation', 'Agent检测到薪资异常（>' + num + '元/天），将被标记待人工复核');
    else if (document.getElementById('pub-violation').textContent.startsWith('Agent检测到薪资'))
      hideHint('pub-violation');
  }

  agentViolationCheck(title, desc);
}
function agentAutoComplete(desc, title) {
  const keywords = {
    '咖啡': '工作内容包含饮品制作、收银操作、台面清洁，需保持卫生标准。',
    '导购': '工作内容包含商品展示、顾客引导、试衣协助、库存盘点。',
    '家教': '工作内容包含课前备课、知识点讲解、课后作业批改、定期反馈学习进度。',
    '配送': '工作内容包含订单接收、取餐配送、异常处理，需熟悉周边路线。',
    '设计': '工作内容包含素材收集、排版设计、配图处理、稿件修改迭代。',
  };
  for (const [k, v] of Object.entries(keywords)) {
    if (desc.includes(k) || (title && title.includes(k))) return v;
  }
  return null;
}
const violationKeywords = ['刷单','刷量','高额返利','日入过千','轻松赚钱','赌博','色情','传销','走私','代写论文'];
function agentViolationCheck(title, desc) {
  const text = (title||'') + (desc||'');
  const found = violationKeywords.find(k => text.includes(k));
  const el = document.getElementById('pub-violation');
  if (found) { el.style.display = 'flex'; el.textContent = 'Agent检测到疑似违规关键词「' + found + '」，岗位将被自动下线，请修改后提交'; }
  else { el.style.display = 'none'; }
}
function showHint(id, msg) { const el = document.getElementById(id); if(el){el.style.display='flex'; el.textContent = msg;} }
function hideHint(id) { const el = document.getElementById(id); if(el) el.style.display = 'none'; }

function submitJob() {
  const user = getCurrentUser();
  if (!user || !isMerchant()) { toast('请以商家身份登录'); navigate('login'); return; }
  const title = document.getElementById('pub-title').value.trim();
  if (!title) { toast('请填写岗位标题'); return; }
  const violation = document.getElementById('pub-violation');
  if (violation.style.display !== 'none') { toast('岗位含违规内容，请修改后提交'); return; }
  const salaryStr = document.getElementById('pub-salary').value.trim();
  if (!salaryStr) { toast('请填写薪资'); return; }
  const salaryNumMatch = salaryStr.match(/(\d+)/);
  const salaryNum = salaryNumMatch ? parseInt(salaryNumMatch[1]) : 0;
  if (!document.getElementById('pub-location').value.trim()) { toast('请填写工作地点'); return; }
  if (!document.getElementById('pub-worktime').value.trim()) { toast('请填写工作时间'); return; }

  const newJob = {
    id: DB.nextJobId++,
    merchantId: user.id,
    merchantName: user.merchantName || user.name,
    title: title,
    category: document.getElementById('pub-category').value,
    salary: salaryStr,
    salaryNum: salaryNum,
    location: document.getElementById('pub-location').value.trim(),
    distance: '—',
    workTime: document.getElementById('pub-worktime').value.trim(),
    duration: document.getElementById('pub-duration').value.trim() || '面议',
    headcount: parseInt(document.getElementById('pub-headcount').value) || 1,
    tags: document.getElementById('pub-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    status: 'open', urgent: false, views: 0,
    desc: document.getElementById('pub-desc').value.trim() || '暂无描述',
    requirement: document.getElementById('pub-requirement').value.trim() || '无特殊要求',
    benefits: document.getElementById('pub-benefits').value.trim() || '面议',
    createdAt: new Date().toLocaleDateString('zh-CN'),
  };
  DB.jobs.unshift(newJob);
  saveDB(DB);
  toast('岗位发布成功！Agent已自动审核通过');
  resetPublishForm();
  setTimeout(() => navigate('jobs'), 1200);
}

// ========== Applications ==========
let currentAppTab = 'all';
function switchAppTab(el, tab) {
  document.querySelectorAll('#page-applications .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentAppTab = tab;
  renderApplications(tab);
}
function renderApplications(tab) {
  const user = getCurrentUser();
  if (!user) return;
  let apps = getUserApplications(user.id);
  if (tab && tab !== 'all') apps = apps.filter(a => a.status === tab);
  const tbody = document.getElementById('app-tbody');
  if (!tbody) return;
  if (apps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">暂无投递记录</td></tr>';
    return;
  }
  tbody.innerHTML = apps.map(a => `<tr>
    <td><a onclick="navigate('detail', ${a.jobId})">${esc(a.jobTitle)}</a></td>
    <td>${esc(a.merchantName)}</td>
    <td>${esc(a.applyTime)}</td>
    <td><span class="order-status order-${a.status}">${esc(a.statusText)}</span></td>
  </tr>`).join('');
}

// ========== Orders ==========
function renderOrders() {
  const user = getCurrentUser();
  if (!user) return;
  const orders = getUserOrders(user.id);
  const tbody = document.getElementById('order-tbody');
  if (!tbody) return;
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">暂无订单</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `<tr>
    <td style="font-family:monospace">${esc(o.id)}</td>
    <td>${esc(o.jobTitle)}</td>
    <td>${esc(o.merchantName)}</td>
    <td>${esc(o.date)}</td>
    <td>${o.hours}h</td>
    <td style="font-weight:700;color:var(--secondary)">¥${o.total}</td>
    <td><span class="order-status order-${o.status}">${esc(o.statusText)}</span></td>
    <td>${o.status === 'completed' && !o.rated ? `<button class="btn-rate" onclick="openRatingModal('${esc(o.id)}')">评价</button>` : o.rated ? '已评价' : '—'}</td>
  </tr>`).join('');
}

// ========== Rating Modal ==========
function openRatingModal(orderId) {
  const order = DB.orders.find(o => o.id === orderId);
  if (!order) return;
  const user = getCurrentUser();
  const toId = user.role === 'student' ? order.merchantId : order.studentId;
  const toUser = DB.users.find(u => u.id === toId);
  document.getElementById('rating-to-name').textContent = toUser ? toUser.name : '对方';
  const modal = document.getElementById('rating-modal');
  modal.style.display = 'flex';
  modal.dataset.orderId = orderId;
  modal.dataset.toId = toId;
  document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));
  modal.dataset.selected = '0';
  document.getElementById('rating-content').value = '';
}
function closeRatingModal() {
  document.getElementById('rating-modal').style.display = 'none';
}
function selectStar(el, n) {
  document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));
  for (let i = 1; i <= n; i++) document.getElementById('star-' + i).classList.add('active');
  document.getElementById('rating-modal').dataset.selected = n;
}
function submitRating() {
  const modal = document.getElementById('rating-modal');
  const orderId = modal.dataset.orderId;
  const toId = parseInt(modal.dataset.toId);
  const rating = parseInt(modal.dataset.selected || '5');
  const content = document.getElementById('rating-content').value.trim();
  const user = getCurrentUser();

  DB.ratings.push({
    id: DB.nextRatingId++,
    orderId, fromId: user.id, toId, rating, content,
    createdAt: new Date().toLocaleDateString('zh-CN'),
  });
  const order = DB.orders.find(o => o.id === orderId);
  if (order) order.rated = true;
  saveDB(DB);
  closeRatingModal();
  toast('评价提交成功！');
  renderOrders();
}

// ========== Merchant Dashboard ==========
function renderMerchantDashboard() {
  const user = getCurrentUser();
  if (!user || !isMerchant()) return;
  const myJobs = getMerchantJobs(user.id);
  const myApps = getMerchantApplications(user.id);

  document.getElementById('merchant-stats').innerHTML = `
    <div class="agent-stat-card"><div class="stat-icon">📋</div><div class="stat-value">${myJobs.length}</div><div class="stat-label">已发布岗位</div></div>
    <div class="agent-stat-card"><div class="stat-icon">📨</div><div class="stat-value">${myApps.length}</div><div class="stat-label">收到投递</div></div>
    <div class="agent-stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${getAvgRating(user.id)}</div><div class="stat-label">平均评分</div></div>`;

  const jobTbody = document.getElementById('merchant-job-tbody');
  if (jobTbody) {
    if (myJobs.length === 0) {
      jobTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">暂未发布岗位</td></tr>';
    } else {
      jobTbody.innerHTML = myJobs.map(j => {
        const appCount = myApps.filter(a => a.jobId === j.id).length;
        return `<tr>
          <td><a onclick="navigate('detail', ${j.id})">${esc(j.title)}</a></td>
          <td>${esc(j.salary)}</td>
          <td><span class="status-badge ${j.urgent ? 'status-urgent' : 'status-open'}">${j.urgent ? '急招' : '招聘中'}</span></td>
          <td>${appCount}人投递</td>
        </tr>`;
      }).join('');
    }
  }

  const appTbody = document.getElementById('merchant-app-tbody');
  if (appTbody) {
    const pending = myApps.filter(a => a.status === 'pending');
    if (pending.length === 0) {
      appTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">暂无待处理投递</td></tr>';
    } else {
      appTbody.innerHTML = pending.map(a => `<tr>
        <td>${esc(a.studentName)}</td>
        <td><a onclick="navigate('detail', ${a.jobId})">${esc(a.jobTitle)}</a></td>
        <td>${esc(a.applyTime)}</td>
        <td><span class="order-status order-pending">待处理</span></td>
        <td>
          <button class="btn-accept" onclick="acceptApplication(${a.id})">录用</button>
          <button class="btn-reject" onclick="rejectApplication(${a.id})">拒绝</button>
        </td>
      </tr>`).join('');
    }
  }
}

function acceptApplication(appId) {
  confirmDialog('确认录用该学生？录用后将自动生成订单。', () => {
  const app = DB.applications.find(a => a.id === appId);
  if (!app) return;
  app.status = 'accepted';
  app.statusText = '已录用';
  const job = getJobById(app.jobId);
  const orderNo = 'ORD' + Date.now().toString().slice(-10);
  DB.orders.unshift({
    id: orderNo, jobId: app.jobId, jobTitle: app.jobTitle,
    merchantId: app.merchantId, merchantName: app.merchantName,
    studentId: app.studentId, studentName: app.studentName,
    date: new Date().toLocaleDateString('zh-CN'),
    hours: 8, salary: job ? job.salaryNum : 0, total: job ? job.salaryNum * 8 : 0,
    status: 'ongoing', statusText: '进行中', rated: false,
  });
  DB.notifications.push({
    id: DB.nextNotifId++, userId: app.studentId, type: 'order',
    title: '投递通过', content: '「' + app.jobTitle + '」已通过审核，订单已生成', read: false,
    time: new Date().toLocaleString('zh-CN'),
  });
  saveDB(DB);
  toast('已录用，订单已生成');
  updateNavByRole();
  renderMerchantDashboard();
  });
}

function rejectApplication(appId) {
  confirmDialog('确认拒绝该投递？', () => {
  const app = DB.applications.find(a => a.id === appId);
  if (!app) return;
  app.status = 'rejected';
  app.statusText = '已拒绝';
  DB.notifications.push({
    id: DB.nextNotifId++, userId: app.studentId, type: 'application',
    title: '投递未通过', content: '「' + app.jobTitle + '」投递未通过', read: false,
    time: new Date().toLocaleString('zh-CN'),
  });
  saveDB(DB);
  toast('已拒绝该投递');
  renderMerchantDashboard();
  });
}

// ========== Agent Panel ==========
function renderAgent() {
  document.getElementById('agent-stats').innerHTML = `
    <div class="agent-stat-card"><div class="stat-icon">🔍</div><div class="stat-value">${DB.agentStats.reviewed}</div><div class="stat-label">违规审核次数</div></div>
    <div class="agent-stat-card"><div class="stat-icon">✨</div><div class="stat-value">${DB.agentStats.completed}</div><div class="stat-label">信息补全次数</div></div>
    <div class="agent-stat-card"><div class="stat-icon">🎯</div><div class="stat-value">${DB.agentStats.matched}</div><div class="stat-label">智能推荐次数</div></div>`;
  document.getElementById('agent-log-list').innerHTML = DB.agentLogs.map(l => `<div class="log-item">
    <div class="log-type log-type-${l.type}">${l.icon}</div>
    <div class="log-content">
      <div class="log-title">${esc(l.title)}</div>
      <div class="log-desc">${esc(l.desc)}</div>
    </div>
    <div class="log-time">${esc(l.time)}</div>
  </div>`).join('');
}

// ========== Notifications ==========
function renderNotifications() {
  const user = getCurrentUser();
  if (!user) return;
  const notifs = getUserNotifications(user.id).reverse();
  const el = document.getElementById('notif-list');
  if (!el) return;
  if (notifs.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><p>暂无通知</p></div>';
    return;
  }
  el.innerHTML = notifs.map(n => `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id})">
    <div class="notif-icon">${n.type === 'order' ? '📦' : n.type === 'application' ? '📨' : '🔔'}</div>
    <div class="notif-content">
      <div class="notif-title">${esc(n.title)}</div>
      <div class="notif-desc">${esc(n.content)}</div>
      <div class="notif-time">${esc(n.time)}</div>
    </div>
    ${!n.read ? '<div class="notif-dot"></div>' : ''}
  </div>`).join('');
}
function markRead(id) {
  const n = DB.notifications.find(x => x.id === id);
  if (n) { n.read = true; saveDB(DB); updateNavByRole(); renderNotifications(); }
}

// ========== Profile ==========
let editSelectedCategories = [];

function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;
  const apps = getUserApplications(user.id);
  const orders = getUserOrders(user.id);
  const completed = orders.filter(o => o.status === 'completed');
  const totalIncome = completed.reduce((s, o) => s + o.total, 0);
  const avgRating = getAvgRating(user.id);
  const ratings = getRatingsForUser(user.id);
  const completeness = getProfileCompleteness(user);

  const isStudent = user.role === 'student';
  const subtitle = isStudent
    ? esc(user.university) + ' · ' + esc(user.major) + ' · ' + esc(user.grade)
    : esc(user.merchantName) + ' · ' + esc(user.merchantAddr);

  document.getElementById('profile-info').innerHTML = `
    <div class="profile-avatar">${esc(user.avatar)}</div>
    <div class="profile-info" style="flex:1">
      <div style="display:flex;align-items:center;gap:10px">
        <h2>${esc(user.name)}</h2>
        <span class="profile-role-badge ${isStudent ? 'role-student' : 'role-merchant'}">${isStudent ? '🎓 学生' : '🏪 商家'}</span>
      </div>
      <p style="color:var(--text-muted);font-size:14px;margin-top:2px">${subtitle}</p>
      <p style="color:var(--text-muted);font-size:13px;margin-top:4px">手机：${esc(user.phone)}</p>
      <div class="profile-tags">
        <span class="profile-tag">信用分 ${user.creditScore}</span>
        ${avgRating > 0 ? `<span class="profile-tag tag-accent">⭐ ${avgRating}</span>` : ''}
        <span class="profile-tag">注册于 ${esc(user.createdAt)}</span>
      </div>
    </div>
    <button class="btn-edit-profile" onclick="openEditProfileModal()">编辑资料</button>`;

  const compEl = document.getElementById('profile-completeness');
  if (compEl) {
    const compColor = completeness >= 80 ? 'var(--secondary)' : completeness >= 50 ? 'var(--warning)' : 'var(--danger)';
    compEl.innerHTML = `
      <div class="completeness-header">
        <span style="font-size:13px;font-weight:600">资料完整度</span>
        <span style="font-size:14px;font-weight:800;color:${compColor}">${completeness}%</span>
      </div>
      <div class="completeness-track">
        <div class="completeness-fill" style="width:${completeness}%;background:${compColor}"></div>
      </div>
      ${completeness < 100 ? `<p style="font-size:12px;color:var(--text-muted);margin-top:6px">完善资料可提升匹配推荐精度${completeness < 50 ? '，建议尽快补充' : ''}</p>` : '<p style="font-size:12px;color:var(--secondary);margin-top:6px">资料已完善，匹配推荐精度最佳</p>'}
    `;
  }

  const bioEl = document.getElementById('profile-bio');
  if (bioEl) {
    bioEl.innerHTML = user.bio && user.bio.trim()
      ? `<p class="bio-text">${esc(user.bio)}</p>`
      : `<div class="empty-inline" style="text-align:center;padding:20px"><p style="color:var(--text-muted);font-size:14px">还没有填写个人简介</p><button class="btn-link" onclick="openEditProfileModal()">去完善</button></div>`;
  }

  const skillsEl = document.getElementById('profile-skills');
  if (skillsEl) {
    const skills = user.skills || [];
    if (skills.length > 0) {
      skillsEl.innerHTML = `<div class="skill-tags">${skills.map((s, i) => {
        const levels = ['入门', '熟悉', '熟练', '精通'];
        const level = levels[Math.min(i % 4, 3)];
        const barWidth = ((i % 4) + 1) * 25;
        return `<div class="skill-tag-item">
          <div class="skill-tag-header"><span>${esc(s)}</span><span class="skill-level">${level}</span></div>
          <div class="skill-bar"><div class="skill-bar-fill" style="width:${barWidth}%"></div></div>
        </div>`;
      }).join('')}</div>`;
    } else {
      skillsEl.innerHTML = '<div class="empty-inline" style="text-align:center;padding:20px"><p style="color:var(--text-muted);font-size:14px">暂未添加技能标签</p></div>';
    }
  }

  const availEl = document.getElementById('profile-availability');
  if (availEl) {
    if (isStudent) {
      const cats = user.preferredCategories || [];
      availEl.innerHTML = `
        <div class="avail-grid">
          <div class="avail-item">
            <div class="avail-icon">📅</div>
            <div class="avail-label">空闲时间</div>
            <div class="avail-value">${esc(user.availableTime) || '未填写'}</div>
          </div>
          <div class="avail-item">
            <div class="avail-icon">💰</div>
            <div class="avail-label">期望薪资</div>
            <div class="avail-value">${esc(user.expectedSalary) || '面议'}</div>
          </div>
        </div>
        <div style="margin-top:16px">
          <div class="avail-label" style="margin-bottom:8px">偏好岗位分类</div>
          ${cats.length > 0
            ? `<div class="pref-cats">${cats.map(c => `<span class="pref-cat-tag">${esc(c)}</span>`).join('')}</div>`
            : '<p style="color:var(--text-muted);font-size:13px">暂未设置偏好分类</p>'}
        </div>`;
    } else {
      availEl.innerHTML = `
        <div class="avail-grid">
          <div class="avail-item">
            <div class="avail-icon">🏪</div>
            <div class="avail-label">商家名称</div>
            <div class="avail-value">${esc(user.merchantName)}</div>
          </div>
          <div class="avail-item">
            <div class="avail-icon">📍</div>
            <div class="avail-label">商家地址</div>
            <div class="avail-value">${esc(user.merchantAddr)}</div>
          </div>
        </div>`;
    }
  }

  const matchEl = document.getElementById('profile-smart-match');
  if (matchEl && isStudent) {
    const matches = getSmartMatchJobs(user.id, 3);
    if (matches.length > 0) {
      matchEl.innerHTML = matches.map(j => `
        <div class="smart-match-card" onclick="navigate('detail', ${j.id})">
          <div class="match-info">
            <div style="font-weight:700;font-size:14px">${esc(j.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${esc(j.merchantName)} · ${esc(j.salary)}</div>
          </div>
          <div class="match-score">
            <div class="match-score-ring" style="--p:${j.matchScore}%"><span>${j.matchScore}</span></div>
            <span style="font-size:11px;color:var(--text-muted)">匹配度</span>
          </div>
        </div>`).join('');
    } else {
      matchEl.innerHTML = '<div class="empty-inline" style="padding:20px;text-align:center"><p style="color:var(--text-muted);font-size:14px">暂无可推荐岗位，请完善偏好设置</p></div>';
    }
  } else if (matchEl) {
    matchEl.innerHTML = '<div class="empty-inline" style="padding:20px;text-align:center"><p style="color:var(--text-muted);font-size:14px">智能推荐仅对学生开放</p></div>';
  }

  const achEl = document.getElementById('profile-achievements');
  if (achEl) {
    const achievements = user.achievements || [];
    const allKeys = Object.keys(ACHIEVEMENT_DEFS);
    achEl.innerHTML = allKeys.map(key => {
      const def = ACHIEVEMENT_DEFS[key];
      const earned = achievements.includes(key);
      return `<div class="achievement-badge ${earned ? 'earned' : 'locked'}">
        <div class="ach-icon">${def.icon}</div>
        <div class="ach-name">${def.name}</div>
        <div class="ach-desc">${def.desc}</div>
      </div>`;
    }).join('');
  }

  const resumeEl = document.getElementById('profile-resume');
  if (resumeEl) {
    if (isStudent) {
      resumeEl.innerHTML = `
        <div class="resume-mini">
          <div class="resume-header">
            <div class="resume-avatar">${esc(user.avatar)}</div>
            <div>
              <div class="resume-name">${esc(user.name)}</div>
              <div class="resume-sub">${esc(user.university)} · ${esc(user.major)} · ${esc(user.grade)}</div>
              <div class="resume-contact">${esc(user.phone)}</div>
            </div>
          </div>
          <div class="resume-section">
            <div class="resume-section-title">个人简介</div>
            <p>${esc(user.bio || '暂无简介')}</p>
          </div>
          <div class="resume-section">
            <div class="resume-section-title">技能</div>
            <p>${(user.skills||[]).join('、') || '暂无'}</p>
          </div>
          <div class="resume-section">
            <div class="resume-section-title">兼职经历</div>
            <p>${completed.length}份已完成 · 累计收入${totalIncome}元</p>
          </div>
        </div>
        <button class="btn-print-resume" onclick="printResume()">打印简历</button>`;
    } else {
      resumeEl.innerHTML = `
        <div class="resume-mini">
          <div class="resume-header">
            <div class="resume-avatar">${esc(user.avatar)}</div>
            <div>
              <div class="resume-name">${esc(user.merchantName)}</div>
              <div class="resume-sub">${esc(user.name)} · ${esc(user.merchantAddr)}</div>
              <div class="resume-contact">${esc(user.phone)}</div>
            </div>
          </div>
          <div class="resume-section">
            <div class="resume-section-title">商家简介</div>
            <p>${esc(user.bio || '暂无简介')}</p>
          </div>
          <div class="resume-section">
            <div class="resume-section-title">招聘数据</div>
            <p>已发布${getMerchantJobs(user.id).length}个岗位 · 收到${getMerchantApplications(user.id).length}份投递</p>
          </div>
        </div>`;
    }
  }

  document.getElementById('profile-stats').innerHTML = `
    <div class="agent-stat-card"><div class="stat-icon">${isStudent ? '📝' : '📋'}</div><div class="stat-value">${isStudent ? apps.length : getMerchantJobs(user.id).length}</div><div class="stat-label">${isStudent ? '累计投递' : '已发布岗位'}</div></div>
    <div class="agent-stat-card"><div class="stat-icon">✅</div><div class="stat-value">${isStudent ? apps.filter(a => a.status === 'accepted' || a.status === 'completed').length : getMerchantApplications(user.id).length}</div><div class="stat-label">${isStudent ? '成功录用' : '收到投递'}</div></div>
    <div class="agent-stat-card"><div class="stat-icon">💰</div><div class="stat-value">${totalIncome}</div><div class="stat-label">${isStudent ? '累计收入(元)' : '支付总额(元)'}</div></div>`;

  const ratingList = document.getElementById('profile-ratings');
  if (ratingList) {
    if (ratings.length === 0) {
      ratingList.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><p>暂无评价</p></div>';
    } else {
      ratingList.innerHTML = ratings.map(r => {
        const fromUser = DB.users.find(u => u.id === r.fromId);
        return `<div class="review-item">
          <div class="review-header">
            <span style="font-weight:600">${esc(fromUser ? fromUser.name : '匿名')}</span>
            <span class="stars">${'⭐'.repeat(r.rating)}</span>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin-top:4px">${esc(r.content || '暂无评价内容')}</p>
          <span style="font-size:12px;color:var(--text-muted)">${esc(r.createdAt)}</span>
        </div>`;
      }).join('');
    }
  }
}

function openEditProfileModal() {
  const user = getCurrentUser();
  if (!user) return;
  const modal = document.getElementById('edit-profile-modal');
  const isStudent = user.role === 'student';

  document.getElementById('edit-bio').value = user.bio || '';
  document.getElementById('edit-student-only').style.display = isStudent ? '' : 'none';
  document.getElementById('edit-merchant-only').style.display = isStudent ? 'none' : '';

  if (isStudent) {
    document.getElementById('edit-skills').value = (user.skills || []).join(', ');
    document.getElementById('edit-available').value = user.availableTime || '';
    document.getElementById('edit-salary').value = user.expectedSalary || '';
    editSelectedCategories = [...(user.preferredCategories || [])];
    const catBox = document.getElementById('edit-categories');
    catBox.innerHTML = DB.categories.map(c => {
      const checked = editSelectedCategories.includes(c.name) ? 'checked' : '';
      return `<label class="checkbox-pill ${checked}" data-cat="${esc(c.name)}" onclick="toggleEditCategory(this)">
        <span>${c.icon} ${esc(c.name)}</span>
      </label>`;
    }).join('');
  } else {
    document.getElementById('edit-merchant-name').value = user.merchantName || '';
    document.getElementById('edit-merchant-addr').value = user.merchantAddr || '';
  }

  modal.style.display = 'flex';
}

function closeEditProfileModal() {
  document.getElementById('edit-profile-modal').style.display = 'none';
}

function toggleEditCategory(el) {
  const name = el.dataset.cat;
  const idx = editSelectedCategories.indexOf(name);
  if (idx >= 0) editSelectedCategories.splice(idx, 1);
  else editSelectedCategories.push(name);
  el.classList.toggle('checked', editSelectedCategories.includes(name));
}

function saveProfileEdit() {
  const user = getCurrentUser();
  if (!user) return;
  const bio = document.getElementById('edit-bio').value.trim();
  user.bio = bio;

  if (user.role === 'student') {
    const skillsRaw = document.getElementById('edit-skills').value.trim();
    user.skills = skillsRaw ? skillsRaw.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : [];
    user.availableTime = document.getElementById('edit-available').value.trim();
    user.expectedSalary = document.getElementById('edit-salary').value.trim();
    user.preferredCategories = [...editSelectedCategories];
  } else {
    user.merchantName = document.getElementById('edit-merchant-name').value.trim() || user.merchantName;
    user.merchantAddr = document.getElementById('edit-merchant-addr').value.trim() || user.merchantAddr;
  }

  const idx = DB.users.findIndex(u => u.id === user.id);
  if (idx >= 0) DB.users[idx] = user;
  saveDB(DB);
  closeEditProfileModal();
  toast('资料已更新');
  renderProfile();
}

function printResume() {
  const user = getCurrentUser();
  if (!user) return;
  const orders = getUserOrders(user.id);
  const completed = orders.filter(o => o.status === 'completed');
  const totalIncome = completed.reduce((s, o) => s + o.total, 0);
  const avgRating = getAvgRating(user.id);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(user.name)} - 简历</title>
  <style>
    body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;max-width:680px;margin:0 auto;padding:40px;color:#0F172A;line-height:1.6}
    .r-header{display:flex;gap:20px;align-items:center;border-bottom:3px solid #0D9488;padding-bottom:16px;margin-bottom:20px}
    .r-avatar{width:64px;height:64px;border-radius:50%;background:#0D9488;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}
    .r-name{font-size:24px;font-weight:800}
    .r-sub{color:#64748B;font-size:14px;margin-top:2px}
    .r-contact{color:#64748B;font-size:13px;margin-top:2px}
    h3{font-size:15px;color:#0D9488;border-left:3px solid #0D9488;padding-left:10px;margin:20px 0 8px}
    p{font-size:14px;color:#475569;margin-bottom:8px}
    .tag{display:inline-block;background:#F0FDFA;color:#0D9488;padding:2px 10px;border-radius:4px;font-size:12px;margin:2px}
  </style></head><body>
  <div class="r-header">
    <div class="r-avatar">${esc(user.avatar)}</div>
    <div>
      <div class="r-name">${esc(user.name)}</div>
      <div class="r-sub">${esc(user.university)} · ${esc(user.major)} · ${esc(user.grade)}</div>
      <div class="r-contact">${esc(user.phone)} | 信用分：${user.creditScore}${avgRating > 0 ? ' | ⭐ ' + avgRating : ''}</div>
    </div>
  </div>
  <h3>个人简介</h3><p>${esc(user.bio || '暂无简介')}</p>
  <h3>技能标签</h3><p>${(user.skills||[]).map(s => '<span class="tag">' + esc(s) + '</span>').join(' ') || '暂无'}</p>
  <h3>空闲时间</h3><p>${esc(user.availableTime) || '未填写'}</p>
  <h3>期望薪资</h3><p>${esc(user.expectedSalary) || '面议'}</p>
  <h3>兼职经历</h3><p>已完成${completed.length}份兼职，累计收入${totalIncome}元</p>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
  else toast('请允许弹窗以打印简历');
}

// ========== Init ==========
initFilters();
renderHome();
updateNavByRole();
