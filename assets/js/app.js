// ========== Navigation ==========
function navigate(page, params) {
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
  if (page === 'applications') renderApplications('all');
  if (page === 'orders') renderOrders();
  if (page === 'agent') renderAgent();
  if (page === 'profile') renderProfile();
}

// ========== Toast ==========
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ========== Render: Home ==========
function renderHome() {
  const catGrid = document.getElementById('category-grid');
  catGrid.innerHTML = DB.categories.map(c => `
    <div class="category-card" onclick="navigate('jobs')">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-name">${c.name}</div>
      <div class="cat-count">${c.count}个岗位</div>
    </div>`).join('');

  const hotJobs = document.getElementById('hot-jobs');
  hotJobs.innerHTML = DB.jobs.slice(0, 4).map(jobCardHTML).join('');
}

// ========== Render: Jobs ==========
function renderJobs() {
  const search = (document.getElementById('job-search')?.value || '').toLowerCase();
  const cat = document.getElementById('filter-category')?.value || '';
  const sort = document.getElementById('filter-sort')?.value || 'default';

  let jobs = DB.jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search) || j.merchant.toLowerCase().includes(search);
    const matchCat = !cat || j.category === cat;
    return matchSearch && matchCat;
  });

  if (sort === 'salary-desc') jobs.sort((a, b) => b.salaryNum - a.salaryNum);
  if (sort === 'distance-asc') jobs.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  const list = document.getElementById('job-list');
  if (jobs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>未找到匹配的岗位</p></div>';
    return;
  }
  list.innerHTML = jobs.map(jobCardHTML).join('');
}

// populate category filter
function initFilters() {
  const sel = document.getElementById('filter-category');
  if (sel) DB.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name; opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

// ========== Job Card HTML ==========
function jobCardHTML(j) {
  const statusClass = j.urgent ? 'status-urgent' : 'status-open';
  const statusText = j.urgent ? '急招' : '招聘中';
  return `
    <div class="job-card" onclick="navigate('detail', ${j.id})">
      <div class="job-header">
        <div class="job-title">${j.title}</div>
        <div class="job-salary">${j.salary}</div>
      </div>
      <div class="job-meta">
        <span>📍 ${j.location} (${j.distance})</span>
        <span>⏰ ${j.workTime}</span>
        <span>👥 招${j.headcount}人</span>
      </div>
      <div class="job-tags">${j.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="job-footer">
        <div class="merchant-info">
          <div class="merchant-avatar">${j.merchant[0]}</div>
          <span>${j.merchant}</span>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    </div>`;
}

// ========== Render: Detail ==========
function renderDetail(jobId) {
  const j = getJobById(jobId);
  if (!j) { document.getElementById('detail-content').innerHTML = '<p>岗位不存在</p>'; return; }
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <h1>${j.title}</h1>
      <div class="salary">${j.salary}</div>
      <div class="meta-row">
        <span>📍 ${j.location} (${j.distance})</span>
        <span>⏰ ${j.workTime}</span>
        <span>⏳ ${j.duration}</span>
        <span>👥 招${j.headcount}人</span>
        <span>👁️ ${j.views}浏览</span>
      </div>
      <div class="job-tags">${j.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
    <div class="detail-body">
      <h3>岗位描述</h3>
      <p>${j.desc}</p>
      <h3>任职要求</h3>
      <p>${j.requirement}</p>
      <h3>福利待遇</h3>
      <p>${j.benefits}</p>
    </div>
    <div class="detail-actions">
      <button class="btn-primary" onclick="applyJob(${j.id})">立即投递</button>
      <button class="btn-outline" onclick="navigate('jobs')">返回列表</button>
    </div>`;
}

// ========== Apply ==========
function applyJob(jobId) {
  const j = getJobById(jobId);
  toast('投递成功！「' + j.title + '」已提交，等待商家确认');
  DB.applications.unshift({
    id: Date.now(), jobId: jobId, jobTitle: j.title, merchant: j.merchant,
    applyTime: new Date().toLocaleString('zh-CN'), status: 'pending', statusText: '待处理'
  });
  setTimeout(() => navigate('applications'), 1000);
}

// ========== Publish ==========
let publishTimer = null;
function onPublishInput() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(agentPublishAssist, 800);
}

function agentPublishAssist() {
  const title = document.getElementById('pub-title').value.trim();
  const location = document.getElementById('pub-location').value.trim();
  const tags = document.getElementById('pub-tags').value.trim();
  const desc = document.getElementById('pub-desc').value.trim();

  if (title && title.length < 5) {
    showHint('hint-title', '💡 Agent建议：标题可补充具体岗位类型，如「周末咖啡厅吧台助手-包午餐」');
  } else { hideHint('hint-title'); }

  if (location && location.length < 3) {
    showHint('hint-location', '💡 Agent建议：补充具体路段或地标，方便学生定位');
  } else { hideHint('hint-location'); }

  if (tags && tags.split(',').length < 2) {
    showHint('hint-tags', '💡 Agent建议：添加2-3个标签提升曝光，如「包餐,就近,日结」');
  } else { hideHint('hint-tags'); }

  if (desc && desc.length < 10) {
    showHint('hint-desc', '💡 Agent建议：描述可补充具体工作流程，帮助学生快速了解');
  } else if (desc && desc.length >= 10) {
    const completed = agentAutoComplete(desc, title);
    if (completed) showHint('hint-desc', '✨ Agent已自动补全：' + completed);
    else hideHint('hint-desc');
  } else { hideHint('hint-desc'); }

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

const violationKeywords = ['刷单', '刷量', '高额返利', '日入过千', '轻松赚钱', '赌博', '色情'];
function agentViolationCheck(title, desc) {
  const text = (title || '') + (desc || '');
  const found = violationKeywords.find(k => text.includes(k));
  const el = document.getElementById('pub-violation');
  if (found) {
    el.style.display = 'flex';
    el.textContent = '⚠️ Agent检测到疑似违规关键词「' + found + '」，岗位可能被自动下线，请修改后提交';
  } else {
    el.style.display = 'none';
  }
}

function showHint(id, msg) { const el = document.getElementById(id); el.style.display='flex'; el.textContent = msg; }
function hideHint(id) { document.getElementById(id).style.display = 'none'; }

function submitJob() {
  const title = document.getElementById('pub-title').value.trim();
  if (!title) { toast('请填写岗位标题'); return; }
  const violation = document.getElementById('pub-violation');
  if (violation.style.display !== 'none') { toast('岗位含违规内容，请修改后提交'); return; }

  const newJob = {
    id: DB.jobs.length + 1,
    title: title,
    merchant: '我发布的岗位',
    category: document.getElementById('pub-category').value,
    salary: document.getElementById('pub-salary').value || '面议',
    salaryNum: parseInt(document.getElementById('pub-salary').value) || 0,
    location: document.getElementById('pub-location').value || '未填写',
    distance: '—', workTime: document.getElementById('pub-worktime').value || '周末',
    duration: document.getElementById('pub-duration').value || '面议',
    headcount: parseInt(document.getElementById('pub-headcount').value) || 1,
    tags: document.getElementById('pub-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    status: 'open', urgent: false, views: 0,
    desc: document.getElementById('pub-desc').value || '暂无描述',
    requirement: document.getElementById('pub-requirement').value || '无特殊要求',
    benefits: document.getElementById('pub-benefits').value || '面议',
  };
  DB.jobs.unshift(newJob);
  toast('岗位发布成功！Agent已自动审核通过');
  document.querySelectorAll('#page-publish input, #page-publish textarea, #page-publish select').forEach(el => { if (el.id !== 'pub-headcount') el.value = ''; });
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
  let apps = DB.applications;
  if (tab !== 'all') apps = apps.filter(a => a.status === tab);
  const tbody = document.getElementById('app-tbody');
  if (apps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">暂无投递记录</td></tr>';
    return;
  }
  tbody.innerHTML = apps.map(a => `
    <tr>
      <td><a onclick="navigate('detail', ${a.jobId})">${a.jobTitle}</a></td>
      <td>${a.merchant}</td>
      <td>${a.applyTime}</td>
      <td><span class="order-status order-${a.status}">${a.statusText}</span></td>
    </tr>`).join('');
}

// ========== Orders ==========
function renderOrders() {
  const tbody = document.getElementById('order-tbody');
  if (DB.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">暂无订单</td></tr>';
    return;
  }
  tbody.innerHTML = DB.orders.map(o => `
    <tr>
      <td style="font-family:monospace">${o.id}</td>
      <td>${o.jobTitle}</td>
      <td>${o.merchant}</td>
      <td>${o.date}</td>
      <td>${o.hours}h</td>
      <td style="font-weight:700;color:var(--secondary)">¥${o.total}</td>
      <td><span class="order-status order-${o.status}">${o.statusText}</span></td>
    </tr>`).join('');
}

// ========== Agent Panel ==========
function renderAgent() {
  document.getElementById('agent-stats').innerHTML = `
    <div class="agent-stat-card">
      <div class="stat-icon">🔍</div>
      <div class="stat-value">${DB.agentStats.reviewed}</div>
      <div class="stat-label">违规审核次数</div>
    </div>
    <div class="agent-stat-card">
      <div class="stat-icon">✨</div>
      <div class="stat-value">${DB.agentStats.completed}</div>
      <div class="stat-label">信息补全次数</div>
    </div>
    <div class="agent-stat-card">
      <div class="stat-icon">🎯</div>
      <div class="stat-value">${DB.agentStats.matched}</div>
      <div class="stat-label">智能推荐次数</div>
    </div>`;

  document.getElementById('agent-log-list').innerHTML = DB.agentLogs.map(l => `
    <div class="log-item">
      <div class="log-type log-type-${l.type}">${l.icon}</div>
      <div class="log-content">
        <div class="log-title">${l.title}</div>
        <div class="log-desc">${l.desc}</div>
      </div>
      <div class="log-time">${l.time}</div>
    </div>`).join('');
}

// ========== Profile ==========
function renderProfile() {}

// ========== Init ==========
initFilters();
renderHome();
