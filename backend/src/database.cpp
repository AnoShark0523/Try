#include "database.h"
#include <iostream>
#include <sstream>
#include <ctime>
#include <iomanip>

Database::Database(const std::string& dbPath) {
    if (sqlite3_open(dbPath.c_str(), &db_) != SQLITE_OK)
        std::cerr << "DB open error: " << sqlite3_errmsg(db_) << std::endl;
}

Database::~Database() {
    if (db_) sqlite3_close(db_);
}

bool Database::init(const std::string& schemaPath) {
    std::ifstream f(schemaPath);
    if (!f.is_open()) { std::cerr << "Cannot open schema: " << schemaPath << std::endl; return false; }
    std::stringstream ss; ss << f.rdbuf();
    return exec(ss.str());
}

bool Database::exec(const std::string& sql) {
    char* err = nullptr;
    if (sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err) != SQLITE_OK) {
        std::cerr << "SQL error: " << (err ? err : "unknown") << std::endl;
        if (err) sqlite3_free(err);
        return false;
    }
    return true;
}

std::string Database::escape(const std::string& s) {
    std::string r;
    for (char c : s) {
        if (c == '\'') r += "''";
        else r += c;
    }
    return r;
}

// ========== Users ==========
int Database::createUser(const User& u) {
    std::ostringstream ss;
    ss << "INSERT INTO users (phone, password, role, name, university, major, grade, merchant_name, merchant_addr) VALUES ('"
       << escape(u.phone) << "','" << escape(u.password) << "','" << escape(u.role) << "','" << escape(u.name)
       << "','" << escape(u.university) << "','" << escape(u.major) << "','" << escape(u.grade)
       << "','" << escape(u.merchant_name) << "','" << escape(u.merchant_addr) << "');";
    if (exec(ss.str())) return sqlite3_last_insert_rowid(db_);
    return -1;
}

User Database::getUser(int id) {
    User u;
    std::string sql = "SELECT id, phone, password, role, name, university, major, grade, merchant_name, merchant_addr, credit_score, created_at FROM users WHERE id=" + std::to_string(id) + ";";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK && sqlite3_step(stmt) == SQLITE_ROW) {
        u.id = sqlite3_column_int(stmt, 0);
        u.phone = (const char*)sqlite3_column_text(stmt, 1);
        u.password = (const char*)sqlite3_column_text(stmt, 2);
        u.role = (const char*)sqlite3_column_text(stmt, 3);
        u.name = (const char*)sqlite3_column_text(stmt, 4);
        u.university = sqlite3_column_text(stmt, 5) ? (const char*)sqlite3_column_text(stmt, 5) : "";
        u.major = sqlite3_column_text(stmt, 6) ? (const char*)sqlite3_column_text(stmt, 6) : "";
        u.grade = sqlite3_column_text(stmt, 7) ? (const char*)sqlite3_column_text(stmt, 7) : "";
        u.merchant_name = sqlite3_column_text(stmt, 8) ? (const char*)sqlite3_column_text(stmt, 8) : "";
        u.merchant_addr = sqlite3_column_text(stmt, 9) ? (const char*)sqlite3_column_text(stmt, 9) : "";
        u.credit_score = sqlite3_column_int(stmt, 10);
        u.created_at = (const char*)sqlite3_column_text(stmt, 11);
    }
    sqlite3_finalize(stmt);
    return u;
}

User Database::getUserByPhone(const std::string& phone) {
    User u;
    std::string sql = "SELECT id FROM users WHERE phone='" + escape(phone) + "';";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK && sqlite3_step(stmt) == SQLITE_ROW) {
        u = getUser(sqlite3_column_int(stmt, 0));
    }
    sqlite3_finalize(stmt);
    return u;
}

// ========== Jobs ==========
int Database::createJob(const Job& j) {
    std::ostringstream ss;
    ss << "INSERT INTO jobs (merchant_id, title, category, salary, salary_num, location, distance, work_time, duration, headcount, tags, description, requirement, benefits, status, agent_status) VALUES ("
       << j.merchant_id << ",'" << escape(j.title) << "','" << escape(j.category) << "','" << escape(j.salary)
       << "'," << j.salary_num << ",'" << escape(j.location) << "','" << escape(j.distance)
       << "','" << escape(j.work_time) << "','" << escape(j.duration) << "'," << j.headcount
       << ",'" << escape(j.tags) << "','" << escape(j.description) << "','" << escape(j.requirement)
       << "','" << escape(j.benefits) << "','" << escape(j.status) << "','" << escape(j.agent_status) << "');";
    if (exec(ss.str())) return sqlite3_last_insert_rowid(db_);
    return -1;
}

bool Database::updateJobStatus(int id, const std::string& status) {
    return exec("UPDATE jobs SET status='" + escape(status) + "', updated_at=datetime('now','localtime') WHERE id=" + std::to_string(id) + ";");
}

bool Database::updateJobAgentStatus(int id, const std::string& status, const std::string& note) {
    return exec("UPDATE jobs SET agent_status='" + escape(status) + "', agent_note='" + escape(note) + "', updated_at=datetime('now','localtime') WHERE id=" + std::to_string(id) + ";");
}

bool Database::incrementJobViews(int id) {
    return exec("UPDATE jobs SET views=views+1 WHERE id=" + std::to_string(id) + ";");
}

std::vector<Job> Database::getJobs(const std::string& category, const std::string& sort) {
    std::vector<Job> jobs;
    std::string sql = "SELECT id, merchant_id, title, category, salary, salary_num, location, distance, work_time, duration, headcount, tags, description, requirement, benefits, status, agent_status, views, created_at FROM jobs WHERE status IN('open','urgent')";
    if (!category.empty()) sql += " AND category='" + escape(category) + "'";
    if (sort == "salary-desc") sql += " ORDER BY salary_num DESC";
    else if (sort == "distance-asc") sql += " ORDER BY CAST(SUBSTR(distance, 1, INSTR(distance, 'k') - 1) AS REAL) ASC";
    else sql += " ORDER BY created_at DESC";
    sql += ";";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Job j;
            j.id = sqlite3_column_int(stmt, 0);
            j.merchant_id = sqlite3_column_int(stmt, 1);
            j.title = (const char*)sqlite3_column_text(stmt, 2);
            j.category = (const char*)sqlite3_column_text(stmt, 3);
            j.salary = (const char*)sqlite3_column_text(stmt, 4);
            j.salary_num = sqlite3_column_int(stmt, 5);
            j.location = (const char*)sqlite3_column_text(stmt, 6);
            j.distance = sqlite3_column_text(stmt, 7) ? (const char*)sqlite3_column_text(stmt, 7) : "";
            j.work_time = (const char*)sqlite3_column_text(stmt, 8);
            j.duration = sqlite3_column_text(stmt, 9) ? (const char*)sqlite3_column_text(stmt, 9) : "";
            j.headcount = sqlite3_column_int(stmt, 10);
            j.tags = sqlite3_column_text(stmt, 11) ? (const char*)sqlite3_column_text(stmt, 11) : "";
            j.description = sqlite3_column_text(stmt, 12) ? (const char*)sqlite3_column_text(stmt, 12) : "";
            j.requirement = sqlite3_column_text(stmt, 13) ? (const char*)sqlite3_column_text(stmt, 13) : "";
            j.benefits = sqlite3_column_text(stmt, 14) ? (const char*)sqlite3_column_text(stmt, 14) : "";
            j.status = (const char*)sqlite3_column_text(stmt, 15);
            j.agent_status = (const char*)sqlite3_column_text(stmt, 16);
            j.views = sqlite3_column_int(stmt, 17);
            j.created_at = (const char*)sqlite3_column_text(stmt, 18);
            jobs.push_back(j);
        }
    }
    sqlite3_finalize(stmt);
    return jobs;
}

Job Database::getJob(int id) {
    Job j;
    std::string sql = "SELECT id, merchant_id, title, category, salary, salary_num, location, distance, work_time, duration, headcount, tags, description, requirement, benefits, status, agent_status, views, created_at FROM jobs WHERE id=" + std::to_string(id) + ";";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK && sqlite3_step(stmt) == SQLITE_ROW) {
        j.id = sqlite3_column_int(stmt, 0);
        j.merchant_id = sqlite3_column_int(stmt, 1);
        j.title = (const char*)sqlite3_column_text(stmt, 2);
        j.category = (const char*)sqlite3_column_text(stmt, 3);
        j.salary = (const char*)sqlite3_column_text(stmt, 4);
        j.salary_num = sqlite3_column_int(stmt, 5);
        j.location = (const char*)sqlite3_column_text(stmt, 6);
        j.distance = sqlite3_column_text(stmt, 7) ? (const char*)sqlite3_column_text(stmt, 7) : "";
        j.work_time = (const char*)sqlite3_column_text(stmt, 8);
        j.duration = sqlite3_column_text(stmt, 9) ? (const char*)sqlite3_column_text(stmt, 9) : "";
        j.headcount = sqlite3_column_int(stmt, 10);
        j.tags = sqlite3_column_text(stmt, 11) ? (const char*)sqlite3_column_text(stmt, 11) : "";
        j.description = sqlite3_column_text(stmt, 12) ? (const char*)sqlite3_column_text(stmt, 12) : "";
        j.requirement = sqlite3_column_text(stmt, 13) ? (const char*)sqlite3_column_text(stmt, 13) : "";
        j.benefits = sqlite3_column_text(stmt, 14) ? (const char*)sqlite3_column_text(stmt, 14) : "";
        j.status = (const char*)sqlite3_column_text(stmt, 15);
        j.agent_status = (const char*)sqlite3_column_text(stmt, 16);
        j.views = sqlite3_column_int(stmt, 17);
        j.created_at = (const char*)sqlite3_column_text(stmt, 18);
    }
    sqlite3_finalize(stmt);
    return j;
}

// ========== Applications ==========
int Database::createApplication(const Application& a) {
    std::ostringstream ss;
    ss << "INSERT INTO applications (job_id, student_id, message, status) VALUES ("
       << a.job_id << "," << a.student_id << ",'" << escape(a.message) << "','pending');";
    if (exec(ss.str())) return sqlite3_last_insert_rowid(db_);
    return -1;
}

bool Database::updateApplicationStatus(int id, const std::string& status) {
    return exec("UPDATE applications SET status='" + escape(status) + "', updated_at=datetime('now','localtime') WHERE id=" + std::to_string(id) + ";");
}

std::vector<Application> Database::getApplicationsByStudent(int studentId) {
    std::vector<Application> apps;
    std::string sql = "SELECT id, job_id, student_id, message, status, created_at, updated_at FROM applications WHERE student_id=" + std::to_string(studentId) + " ORDER BY created_at DESC;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Application a;
            a.id = sqlite3_column_int(stmt, 0);
            a.job_id = sqlite3_column_int(stmt, 1);
            a.student_id = sqlite3_column_int(stmt, 2);
            a.message = sqlite3_column_text(stmt, 3) ? (const char*)sqlite3_column_text(stmt, 3) : "";
            a.status = (const char*)sqlite3_column_text(stmt, 4);
            a.created_at = (const char*)sqlite3_column_text(stmt, 5);
            a.updated_at = (const char*)sqlite3_column_text(stmt, 6) ? (const char*)sqlite3_column_text(stmt, 6) : "";
            apps.push_back(a);
        }
    }
    sqlite3_finalize(stmt);
    return apps;
}

std::vector<Application> Database::getApplicationsByJob(int jobId) {
    std::vector<Application> apps;
    std::string sql = "SELECT id, job_id, student_id, message, status, created_at, updated_at FROM applications WHERE job_id=" + std::to_string(jobId) + " ORDER BY created_at DESC;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Application a;
            a.id = sqlite3_column_int(stmt, 0);
            a.job_id = sqlite3_column_int(stmt, 1);
            a.student_id = sqlite3_column_int(stmt, 2);
            a.message = sqlite3_column_text(stmt, 3) ? (const char*)sqlite3_column_text(stmt, 3) : "";
            a.status = (const char*)sqlite3_column_text(stmt, 4);
            a.created_at = (const char*)sqlite3_column_text(stmt, 5);
            a.updated_at = sqlite3_column_text(stmt, 6) ? (const char*)sqlite3_column_text(stmt, 6) : "";
            apps.push_back(a);
        }
    }
    sqlite3_finalize(stmt);
    return apps;
}

// ========== Orders ==========
int Database::createOrder(const Order& o) {
    std::ostringstream ss;
    ss << "INSERT INTO orders (order_no, job_id, application_id, student_id, merchant_id, work_date, hours, unit_salary, total_amount, status) VALUES ('"
       << escape(o.order_no) << "'," << o.job_id << "," << o.application_id << "," << o.student_id << "," << o.merchant_id
       << ",'" << escape(o.work_date) << "'," << o.hours << "," << o.unit_salary << "," << o.total_amount << ",'ongoing');";
    if (exec(ss.str())) return sqlite3_last_insert_rowid(db_);
    return -1;
}

bool Database::updateOrderStatus(int id, const std::string& status) {
    return exec("UPDATE orders SET status='" + escape(status) + "', updated_at=datetime('now','localtime') WHERE id=" + std::to_string(id) + ";");
}

std::vector<Order> Database::getOrdersByStudent(int studentId) {
    std::vector<Order> orders;
    std::string sql = "SELECT id, order_no, job_id, application_id, student_id, merchant_id, work_date, hours, unit_salary, total_amount, status, created_at FROM orders WHERE student_id=" + std::to_string(studentId) + " ORDER BY created_at DESC;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Order o;
            o.id = sqlite3_column_int(stmt, 0);
            o.order_no = (const char*)sqlite3_column_text(stmt, 1);
            o.job_id = sqlite3_column_int(stmt, 2);
            o.application_id = sqlite3_column_int(stmt, 3);
            o.student_id = sqlite3_column_int(stmt, 4);
            o.merchant_id = sqlite3_column_int(stmt, 5);
            o.work_date = (const char*)sqlite3_column_text(stmt, 6);
            o.hours = sqlite3_column_double(stmt, 7);
            o.unit_salary = sqlite3_column_double(stmt, 8);
            o.total_amount = sqlite3_column_double(stmt, 9);
            o.status = (const char*)sqlite3_column_text(stmt, 10);
            o.created_at = (const char*)sqlite3_column_text(stmt, 11);
            orders.push_back(o);
        }
    }
    sqlite3_finalize(stmt);
    return orders;
}

std::vector<Order> Database::getOrdersByMerchant(int merchantId) {
    std::vector<Order> orders;
    std::string sql = "SELECT id, order_no, job_id, application_id, student_id, merchant_id, work_date, hours, unit_salary, total_amount, status, created_at FROM orders WHERE merchant_id=" + std::to_string(merchantId) + " ORDER BY created_at DESC;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            Order o;
            o.id = sqlite3_column_int(stmt, 0);
            o.order_no = (const char*)sqlite3_column_text(stmt, 1);
            o.job_id = sqlite3_column_int(stmt, 2);
            o.application_id = sqlite3_column_int(stmt, 3);
            o.student_id = sqlite3_column_int(stmt, 4);
            o.merchant_id = sqlite3_column_int(stmt, 5);
            o.work_date = (const char*)sqlite3_column_text(stmt, 6);
            o.hours = sqlite3_column_double(stmt, 7);
            o.unit_salary = sqlite3_column_double(stmt, 8);
            o.total_amount = sqlite3_column_double(stmt, 9);
            o.status = (const char*)sqlite3_column_text(stmt, 10);
            o.created_at = (const char*)sqlite3_column_text(stmt, 11);
            orders.push_back(o);
        }
    }
    sqlite3_finalize(stmt);
    return orders;
}

// ========== Agent Logs ==========
int Database::createAgentLog(const AgentLog& log) {
    std::ostringstream ss;
    ss << "INSERT INTO agent_logs (action_type, target_type, target_id, title, description) VALUES ('"
       << escape(log.action_type) << "','" << escape(log.target_type) << "'," << log.target_id << ",'"
       << escape(log.title) << "','" << escape(log.description) << "');";
    if (exec(ss.str())) return sqlite3_last_insert_rowid(db_);
    return -1;
}

std::vector<AgentLog> Database::getAgentLogs(int limit) {
    std::vector<AgentLog> logs;
    std::string sql = "SELECT id, action_type, target_type, target_id, title, description, created_at FROM agent_logs ORDER BY created_at DESC LIMIT " + std::to_string(limit) + ";";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            AgentLog l;
            l.id = sqlite3_column_int(stmt, 0);
            l.action_type = (const char*)sqlite3_column_text(stmt, 1);
            l.target_type = (const char*)sqlite3_column_text(stmt, 2);
            l.target_id = sqlite3_column_int(stmt, 3);
            l.title = (const char*)sqlite3_column_text(stmt, 4);
            l.description = sqlite3_column_text(stmt, 5) ? (const char*)sqlite3_column_text(stmt, 5) : "";
            l.created_at = (const char*)sqlite3_column_text(stmt, 6);
            logs.push_back(l);
        }
    }
    sqlite3_finalize(stmt);
    return logs;
}
