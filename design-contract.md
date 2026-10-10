# Design Contract · 大学生周末兼职撮合平台

## Style Tier & Aesthetic Direction
style: business-international
aesthetic: campus-warm — 温暖、年轻、可信赖的校园服务感
tone keywords: 清新 / 活力 / 层次分明 / 信息密度适中

## Design Tokens
color.primary:        #0D9488   (teal-600, 校园感)
color.primary-hover:  #0F766E   (teal-700)
color.primary-light:  #14B8A6   (teal-500)
color.primary-pale:   #F0FDFA   (teal-50, 背景浅色)
color.accent:         #F97316   (orange-500, 点缀)
color.accent-pale:    #FFF7ED   (orange-50)
color.bg:             #F8FAF9   (warm off-white)
color.surface:        #FFFFFF
color.border:         #E2E8F0
color.text:           #0F172A   (slate-900)
color.text-sub:       #64748B   (slate-500)
color.success:        #059669
color.warning:        #D97706
color.danger:         #DC2626
font.display:         "PingFang SC", "Microsoft YaHei", system-ui, sans-serif (700/800 weight)
font.body:            "PingFang SC", "Microsoft YaHei", system-ui, sans-serif (400/500/600)
font.scale:           12 / 13 / 14 / 16 / 20 / 24 / 32 (px)
radius:               sm6 / md10 / lg16 / xl24
shadow.sm:            0 1px 3px rgba(0,0,0,0.05)
shadow.md:            0 4px 12px rgba(0,0,0,0.06)
shadow.lg:            0 12px 32px rgba(0,0,0,0.10)
shadow.glow:          0 0 24px rgba(13,148,136,0.15)
spacing.unit:         4px base (4/8/12/16/24/32/48/64)
layout.max-width:     1200px
layout.grid:          2-4 column responsive
motion.page-load:     staggered reveal (0.06s step, 0.4s duration, ease-out)
motion.hover:         0.25s ease (transform + shadow)
motion.card-lift:     translateY(-4px) + shadow-lg
bg-texture:           subtle gradient mesh (teal-50 → white → orange-50, radial)

## Component Spec
button:    primary(teal,solid) / outline(teal,border) / ghost(transparent) / danger(red) — hover: translateY(-1px) + shadow
input:     8px radius, 1px border, focus: teal border + ring glow
card:      white, 12px radius, shadow.sm → hover shadow.lg + translateY(-4px)
table:     header bg subtle, row hover tint
modal:     centered, backdrop blur, scale-in animation
nav:       sticky top, white bg, bottom border, active item: teal text + bottom indicator
tag:       4px radius, pale bg, primary text color
empty-state: center icon + text, muted color

## App Shell + Canonical Nav
shell: sticky navbar(60px) + container(max-width 1200px, padding 24px)
nav items (ordered, frozen):
  首页 | 岗位大厅 | 发布岗位(merchant) | 投递管理(student) | 订单管理 | 商家面板(merchant) | Agent面板 | 通知 | 我的 | 登录/注册 | 退出
active rule: .active class on nav a element
nav positioning: sticky top:0, z-index:100, white bg, 1px bottom border

## Page List
- 首页 (home): hero + category grid + hot jobs
- 岗位大厅 (jobs): filter bar + job grid
- 岗位详情 (detail): job info card + apply button
- 登录注册 (login): auth card with tab switch
- 发布岗位 (publish): form with agent hints
- 投递管理 (applications): tab bar + table
- 订单管理 (orders): table with rating column
- 商家面板 (merchant): stat cards + job table + pending applications table
- Agent面板 (agent): stat cards + log timeline
- 通知 (notifications): notification list
- 个人中心 (profile): profile header + stats + ratings

## Mock Schema
users: id, phone, password, role, name, avatar, university, major, grade, merchantName, merchantAddr, creditScore, createdAt
jobs: id, merchantId, merchantName, title, category, salary, salaryNum, location, distance, workTime, duration, headcount, tags[], status, urgent, views, desc, requirement, benefits, createdAt
applications: id, jobId, studentId, studentName, jobTitle, merchantId, merchantName, applyTime, status, statusText
orders: id, jobId, jobTitle, merchantId, merchantName, studentId, studentName, date, hours, salary, total, status, statusText, rated
ratings: id, orderId, fromId, toId, rating, content, createdAt
notifications: id, userId, type, title, content, read, time
agentLogs: type, title, desc, time, icon
agentStats: reviewed, completed, matched
categories: id, name, icon

## API Stub Convention
prefix: /api
auth: session-based (mock: localStorage)
all stubs return JSON, errors: { error: "message" }
