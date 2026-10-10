# 页面 → API 映射表

| 页面 | 调用的API端点 | 说明 |
|------|-------------|------|
| 首页 | GET /api/jobs (取前4条) | 热门岗位展示 |
| 岗位大厅 | GET /api/jobs?category=&sort=&search= | 筛选+搜索+排序 |
| 岗位详情 | GET /api/jobs/{id} | 详情展示，浏览量+1 |
| 岗位详情 | POST /api/applications | 立即投递 |
| 登录页 | POST /api/auth/login | 登录验证 |
| 登录页 | POST /api/auth/register | 注册 |
| 发布岗位 | POST /api/jobs | 发布岗位（触发Agent审核） |
| 投递管理 | GET /api/applications?student_id= | 学生投递记录 |
| 订单管理 | GET /api/orders?student_id= 或 ?merchant_id= | 订单列表 |
| 订单管理 | PUT /api/orders/{id}/status | 更新订单状态 |
| 订单管理 | POST /api/ratings | 提交评价 |
| 商家面板 | GET /api/jobs (merchantId过滤) | 我发布的岗位 |
| 商家面板 | GET /api/applications (merchantId过滤) | 收到的投递 |
| 商家面板 | PUT /api/applications/{id}/status | 录用/拒绝 |
| Agent面板 | GET /api/agent/logs | Agent日志 |
| 通知页 | GET /api/notifications?user_id= | 通知列表 |
| 通知页 | PUT /api/notifications/{id}/read | 标记已读 |
| 个人中心 | GET /api/users/{id} | 用户信息 |
| 个人中心 | GET /api/ratings (toId过滤) | 收到的评价 |

## 前端 api.js 接缝层设计
```
// 前端所有数据请求通过 api.js，切换后端只需替换内部实现
const api = {
  getJobs: (params) => fetch('/api/jobs?' + new URLSearchParams(params)),
  getJob: (id) => fetch('/api/jobs/' + id),
  createJob: (data) => fetch('/api/jobs', { method:'POST', body:JSON.stringify(data) }),
  login: (data) => fetch('/api/auth/login', { method:'POST', body:JSON.stringify(data) }),
  register: (data) => fetch('/api/auth/register', { method:'POST', body:JSON.stringify(data) }),
  applyJob: (data) => fetch('/api/applications', { method:'POST', body:JSON.stringify(data) }),
  getApplications: (studentId) => fetch('/api/applications?student_id=' + studentId),
  updateAppStatus: (id, status) => fetch('/api/applications/' + id + '/status', { method:'PUT', body:JSON.stringify({status}) }),
  getOrders: (userId) => fetch('/api/orders?student_id=' + userId),
  submitRating: (data) => fetch('/api/ratings', { method:'POST', body:JSON.stringify(data) }),
  getAgentLogs: () => fetch('/api/agent/logs'),
  getNotifications: (userId) => fetch('/api/notifications?user_id=' + userId),
  markRead: (id) => fetch('/api/notifications/' + id + '/read', { method:'PUT' }),
};
```

## 三级后端接入方案

| 级别 | 适用场景 | 做法 | 前端改动 |
|------|---------|------|---------|
| ① BaaS直连 | 快速验证，小团队 | 将data-model映射到Supabase/Firebase表，替换api.js内部为SDK调用 | 仅api.js内部 |
| ② 契约驱动脚手架 | 自建后端，技术未定 | 用openapi.yaml生成路由/DTO/校验脚手架（Node/Go/C++均可） | 仅api.js内部 |
| ③ 工程交接 | 复杂业务，外包开发 | 将data-model.md + openapi.yaml + endpoint-map.md 交给后端团队独立实现 | 取决于团队 |

> 当前项目已有C++后端源码（backend/src/），属于方案②的实现示例。
