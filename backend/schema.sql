-- ============================================================
-- 大学生周末兼职撮合平台 - 数据库建表脚本
-- SQLite3 兼容语法
-- ============================================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- 用户表（学生 + 商家）
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student' CHECK(role IN('student','merchant','admin')),
    name        TEXT    NOT NULL,
    avatar      TEXT    DEFAULT '',
    university  TEXT    DEFAULT '',          -- 学校
    major       TEXT    DEFAULT '',          -- 专业
    grade       TEXT    DEFAULT '',          -- 年级
    merchant_name TEXT  DEFAULT '',          -- 商家名称
    merchant_addr TEXT   DEFAULT '',         -- 商家地址
    credit_score INTEGER DEFAULT 100,       -- 信用分
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 岗位表
CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    salary      TEXT    NOT NULL,
    salary_num  INTEGER DEFAULT 0,
    location    TEXT    NOT NULL,
    distance    TEXT    DEFAULT '',
    work_time   TEXT    NOT NULL,
    duration    TEXT    DEFAULT '',
    headcount   INTEGER DEFAULT 1,
    tags        TEXT    DEFAULT '',          -- 逗号分隔
    description TEXT    DEFAULT '',
    requirement TEXT    DEFAULT '',
    benefits    TEXT    DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK(status IN('pending','open','urgent','closed','rejected')),
    agent_status TEXT   DEFAULT 'pending'
                CHECK(agent_status IN('pending','approved','flagged','rejected')),
    agent_note  TEXT    DEFAULT '',          -- Agent审核备注
    views       INTEGER DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (merchant_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- 投递表
CREATE TABLE IF NOT EXISTS applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      INTEGER NOT NULL,
    student_id  INTEGER NOT NULL,
    message     TEXT    DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK(status IN('pending','accepted','rejected','cancelled')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_app_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_app_student ON applications(student_id);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no        TEXT    NOT NULL UNIQUE,
    job_id          INTEGER NOT NULL,
    application_id  INTEGER NOT NULL,
    student_id      INTEGER NOT NULL,
    merchant_id     INTEGER NOT NULL,
    work_date       TEXT    NOT NULL,
    hours           REAL    DEFAULT 0,
    unit_salary     REAL    DEFAULT 0,
    total_amount    REAL    DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN('pending','ongoing','completed','cancelled','disputed')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (merchant_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_order_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_order_merchant ON orders(merchant_id);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL,
    from_id     INTEGER NOT NULL,
    to_id       INTEGER NOT NULL,
    rating      INTEGER NOT NULL DEFAULT 5 CHECK(rating BETWEEN 1 AND 5),
    content     TEXT    DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
);

-- Agent日志表
CREATE TABLE IF NOT EXISTS agent_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT    NOT NULL
                CHECK(action_type IN('review','complete','recommend')),
    target_type TEXT    NOT NULL,           -- job / application / user
    target_id   INTEGER,
    title       TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    result      TEXT    DEFAULT '',          -- JSON
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_agent_type ON agent_logs(action_type);

-- 学生画像表（Agent推荐用）
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id      INTEGER PRIMARY KEY,
    preferred_categories TEXT DEFAULT '',   -- 偏好分类，逗号分隔
    preferred_distance   INTEGER DEFAULT 5,-- 最大可接受距离km
    preferred_salary     INTEGER DEFAULT 0,-- 最低薪资期望
    skills          TEXT    DEFAULT '',     -- 技能标签
    available_time TEXT    DEFAULT '',      -- 可用时间段
    total_orders   INTEGER DEFAULT 0,
    total_income   REAL    DEFAULT 0,
    avg_rating     REAL    DEFAULT 5.0,
    updated_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- ===================== 初始测试数据 =====================
INSERT INTO users (phone, password, role, name, university, major, grade) VALUES
('13800000001', '123456', 'student', '李同学', '华中科技大学', '计算机科学', '大三'),
('13800000002', '123456', 'student', '王同学', '武汉大学', '软件工程', '大二');

INSERT INTO users (phone, password, role, name, merchant_name, merchant_addr) VALUES
('13900000001', '123456', 'merchant', '张老板', '蓝湾咖啡', '大学城南路12号'),
('13900000002', '123456', 'merchant', '刘经理', '万达广场HM专柜', '光谷大道1号');

INSERT INTO jobs (merchant_id, title, category, salary, salary_num, location, distance, work_time, duration, headcount, tags, description, requirement, benefits, status, agent_status) VALUES
(3, '周末咖啡厅吧台助手', '餐饮服务', '120元/天', 120, '大学城南区', '0.8km', '周六、周日 9:00-17:00', '8小时/天', 2, '包午餐,就近分配,无经验可', '协助吧台制作饮品、收银、清洁台面', '18-25岁，在校大学生', '包午餐、交通补贴', 'open', 'approved'),
(4, '商场导购员（周末急招）', '零售导购', '150元/天', 150, '万达广场', '2.3km', '周六、周日 10:00-18:00', '8小时/天', 3, '日结,急招,培训上岗', '负责品牌服饰展示、顾客引导', '形象气质佳，有零售经验优先', '日结工资、员工折扣', 'urgent', 'approved');
