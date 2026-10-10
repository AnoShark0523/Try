# 大学生周末兼职撮合平台

> 对接在校大学生与周边商家周末短期用工需求，解决商家用工信息分散、供需匹配效率低的痛点。

**在线Demo**: https://anoshark0523.github.io/Try/

## 项目架构

```
├── index.html              # 前端 SPA 入口（纯静态，部署于 GitHub Pages）
├── assets/
│   ├── css/style.css       # 全局样式
│   └── js/
│       ├── data.js         # Mock 数据
│       └── app.js          # 前端交互逻辑
├── backend/                # C++ 后端（本地编译运行）
│   ├── CMakeLists.txt
│   ├── schema.sql          # SQLite 建表脚本
│   └── src/
│       ├── main.cpp        # 程序入口
│       ├── server.h/.cpp   # HTTP 服务器（Socket）
│       ├── database.h/.cpp # SQLite 数据访问层
│       ├── agent.h/.cpp    # Agent 核心逻辑（C++版）
│       └── models.h        # 数据模型
├── agent/                  # Python 轻量化 Agent 模块（本地运行）
│   ├── agent.py
│   └── requirements.txt
└── README.md
```

## 技术选型

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | HTML + CSS + JS | 纯静态 SPA，无框架依赖，GitHub Pages 可直接部署 |
| 后端 | C++17 + Socket + SQLite3 | 轻量 HTTP API 服务器，核心业务逻辑 |
| Agent | C++（内嵌）+ Python（独立） | 双语言实现，C++版嵌入后端，Python版独立运行 |
| 数据库 | SQLite3 | 轻量级嵌入式数据库，无需额外服务 |

## 功能清单

### 前端页面（7个）

| 页面 | 路由 | 功能说明 |
|---|---|---|
| 首页 | `#home` | 平台介绍、岗位分类入口、热门岗位展示 |
| 岗位大厅 | `#jobs` | 岗位列表、搜索、分类筛选、排序 |
| 岗位详情 | `#detail` | 岗位完整信息、立即投递 |
| 发布岗位 | `#publish` | 商家发布岗位表单，Agent实时辅助（违规检测+信息补全） |
| 投递管理 | `#applications` | 学生投递记录，按状态筛选 |
| 订单管理 | `#orders` | 工作订单列表、状态追踪 |
| Agent面板 | `#agent` | Agent统计概览、运行日志实时展示 |
| 个人中心 | `#profile` | 学生信息、兼职统计 |

### C++ 后端 API

| 方法 | 路径 | 功能 |
|---|---|---|
| GET | `/api/jobs` | 获取岗位列表（支持分类筛选、排序） |
| GET | `/api/jobs/:id` | 获取岗位详情 |
| POST | `/api/jobs` | 发布岗位（触发Agent审核） |
| POST | `/api/applications` | 投递岗位 |
| PUT | `/api/applications/:id/status` | 更新投递状态 |
| GET | `/api/applications?student_id=` | 查询学生投递记录 |
| GET | `/api/orders?student_id=` | 查询学生订单 |
| GET | `/api/agent/logs` | 查询Agent日志 |

### Agent 模块三大功能

1. **岗位违规审核**
   - 违规关键词检测（刷单、传销、色情等16个关键词）
   - 可疑收费模式检测（押金、培训费、保证金等8个模式）
   - 薪资异常检测（日薪>500元自动标记）

2. **信息自动补全**
   - 岗位描述模板匹配（8类岗位知识库）
   - 标签建议（按分类推荐常用标签）
   - 缺失字段提醒

3. **智能推荐增强**
   - 基于学生历史投递的协同过滤
   - 多维度评分：分类偏好(30分) + 薪资(10分) + 距离(20分) + 热度(10分)

## 数据库表设计

### 表结构总览

| 表名 | 说明 | 核心字段 |
|---|---|---|
| `users` | 用户表（学生+商家） | id, phone, role, name, university, merchant_name, credit_score |
| `jobs` | 岗位表 | id, merchant_id, title, category, salary, location, status, agent_status |
| `applications` | 投递表 | id, job_id, student_id, message, status |
| `orders` | 订单表 | id, order_no, job_id, student_id, merchant_id, work_date, total_amount, status |
| `reviews` | 评价表 | id, order_id, from_id, to_id, rating, content |
| `agent_logs` | Agent日志表 | id, action_type, target_type, target_id, title, description |
| `student_profiles` | 学生画像表 | student_id, preferred_categories, preferred_distance, skills |

### 状态枚举

- 岗位状态: `pending → open/urgent → closed/rejected`
- Agent状态: `pending → approved/flagged/rejected`
- 投递状态: `pending → accepted/rejected/cancelled`
- 订单状态: `pending → ongoing → completed/cancelled/disputed`

## 本地运行

### 前端预览

直接用浏览器打开 `index.html` 即可。

### C++ 后端编译运行

```bash
# 安装依赖
# Ubuntu: sudo apt install libsqlite3-dev
# Windows: vcpkg install sqlite3

cd backend
mkdir build && cd build
cmake ..
cmake --build .
./platform_server --port 8080
```

### Python Agent 运行

```bash
cd agent
python agent.py platform.db
```

## 项目方案

### 痛点分析

| 角色 | 痛点 | 解决方案 |
|---|---|---|
| 大学生 | 兼职信息分散，找不到靠谱周末兼职 | 统一平台聚合周边岗位，按距离/薪资/分类筛选 |
| 商家 | 短期用工招人难，信息发布渠道少 | 一键发布岗位，Agent自动补全信息提升吸引力 |
| 双方 | 信息不对称，匹配效率低 | Agent智能推荐，基于学生画像精准匹配 |

### 核心流程

```
商家发布岗位 → Agent违规审核 → 审核通过 → 岗位上架
                                     ↓
                              Agent信息补全
                                     ↓
学生浏览岗位 ← Agent智能推荐 ← 学生画像分析
     ↓
学生投递 → 商家确认 → 生成订单 → 完成工作 → 评价
```

## License

MIT
