#pragma once
#include "models.h"
#include <sqlite3.h>
#include <string>
#include <vector>

class Database {
public:
    Database(const std::string& dbPath = "platform.db");
    ~Database();
    bool init(const std::string& schemaPath = "schema.sql");

    // Users
    int createUser(const User& u);
    User getUser(int id);
    User getUserByPhone(const std::string& phone);

    // Jobs
    int createJob(const Job& j);
    bool updateJobStatus(int id, const std::string& status);
    bool updateJobAgentStatus(int id, const std::string& status, const std::string& note);
    bool incrementJobViews(int id);
    std::vector<Job> getJobs(const std::string& category = "", const std::string& sort = "");
    Job getJob(int id);

    // Applications
    int createApplication(const Application& a);
    bool updateApplicationStatus(int id, const std::string& status);
    std::vector<Application> getApplicationsByStudent(int studentId);
    std::vector<Application> getApplicationsByJob(int jobId);

    // Orders
    int createOrder(const Order& o);
    bool updateOrderStatus(int id, const std::string& status);
    std::vector<Order> getOrdersByStudent(int studentId);
    std::vector<Order> getOrdersByMerchant(int merchantId);

    // Agent Logs
    int createAgentLog(const AgentLog& log);
    std::vector<AgentLog> getAgentLogs(int limit = 20);

private:
    sqlite3* db_ = nullptr;
    bool exec(const std::string& sql);
    std::string escape(const std::string& s);
};
