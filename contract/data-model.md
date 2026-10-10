# 数据模型 — C++ 后端交接契约

## 实体定义

### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 用户ID |
| phone | string UNIQUE | 11位手机号 |
| password | string | 密码（后端应哈希存储） |
| role | enum(student,merchant,admin) | 角色 |
| name | string | 姓名 |
| avatar | string | 头像（首字） |
| university | string? | 学校（学生） |
| major | string? | 专业（学生） |
| grade | string? | 年级（学生） |
| merchantName | string? | 商家名称 |
| merchantAddr | string? | 商家地址 |
| creditScore | int(默认100) | 信用分 |
| createdAt | datetime | 注册时间 |

### jobs（岗位表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 岗位ID |
| merchantId | int FK→users.id | 发布者 |
| merchantName | string | 商家名（冗余，减少JOIN） |
| title | string | 岗位标题 |
| category | string | 分类 |
| salary | string | 薪资显示文本 |
| salaryNum | int | 薪资数值（排序用） |
| location | string | 工作地点 |
| distance | string | 距离描述 |
| workTime | string | 工作时间 |
| duration | string | 工作时长 |
| headcount | int | 招聘人数 |
| tags | string[] | 标签（逗号分隔存储） |
| desc | text | 岗位描述 |
| requirement | text | 任职要求 |
| benefits | text | 福利待遇 |
| status | enum(pending,open,urgent,closed,rejected) | 岗位状态 |
| urgent | bool | 是否急招 |
| views | int | 浏览量 |
| createdAt | datetime | 创建时间 |

### applications（投递表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 投递ID |
| jobId | int FK→jobs.id | 岗位 |
| studentId | int FK→users.id | 学生 |
| studentName | string | 学生姓名（冗余） |
| jobTitle | string | 岗位标题（冗余） |
| merchantId | int FK→users.id | 商家 |
| merchantName | string | 商家名（冗余） |
| applyTime | datetime | 投递时间 |
| status | enum(pending,accepted,rejected,cancelled,completed) | 状态 |

### orders（订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string PK | 订单号（ORD+时间戳） |
| jobId | int FK→jobs.id | 岗位 |
| jobTitle | string | 岗位标题（冗余） |
| merchantId | int FK→users.id | 商家 |
| merchantName | string | 商家名（冗余） |
| studentId | int FK→users.id | 学生 |
| studentName | string | 学生姓名（冗余） |
| date | string | 工作日期 |
| hours | float | 工时 |
| salary | float | 时/日薪 |
| total | float | 总金额 |
| status | enum(ongoing,completed,cancelled,disputed) | 订单状态 |
| rated | bool | 是否已评价 |

### ratings（评价表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 评价ID |
| orderId | string FK→orders.id | 订单 |
| fromId | int FK→users.id | 评价者 |
| toId | int FK→users.id | 被评价者 |
| rating | int(1-5) | 星级 |
| content | text | 评价内容 |
| createdAt | date | 评价日期 |

### notifications（通知表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 通知ID |
| userId | int FK→users.id | 接收者 |
| type | enum(application,order,system) | 类型 |
| title | string | 标题 |
| content | string | 内容 |
| read | bool | 是否已读 |
| time | datetime | 时间 |

### agent_logs（Agent日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK AUTO | 日志ID |
| actionType | enum(review,complete,recommend) | 动作类型 |
| targetType | string | 目标类型(job/user) |
| targetId | int | 目标ID |
| title | string | 标题 |
| description | text | 描述 |
| createdAt | datetime | 时间 |

## 关系图
```
users ──< jobs (merchantId)
users ──< applications (studentId)
jobs  ──< applications (jobId)
users ──< applications (merchantId)
applications ──1:1── orders (applicationId)
orders ──< ratings (orderId)
users ──< notifications (userId)
users ──< ratings (fromId, toId)
```
