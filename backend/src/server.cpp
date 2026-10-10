#include "server.h"
#include "agent.h"
#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <sstream>
#include <algorithm>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#endif

HttpServer::HttpServer(int port, Database& db) : port_(port), db_(db) {
#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif
}

void HttpServer::start() {
    server_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd_ < 0) { std::cerr << "Socket creation failed" << std::endl; return; }

    int opt = 1;
    setsockopt(server_fd_, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port_);

    if (bind(server_fd_, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        std::cerr << "Bind failed on port " << port_ << std::endl;
        return;
    }

    listen(server_fd_, 10);
    running_ = true;
    std::cout << "Server running on http://localhost:" << port_ << std::endl;

    while (running_) {
        struct sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);
        int clientFd = accept(server_fd_, (struct sockaddr*)&clientAddr, &clientLen);
        if (clientFd < 0) continue;
        handleClient(clientFd);
    }
}

void HttpServer::stop() {
    running_ = false;
    if (server_fd_ >= 0) {
#ifdef _WIN32
        closesocket(server_fd_);
#else
        close(server_fd_);
#endif
        server_fd_ = -1;
    }
}

void HttpServer::handleClient(int clientFd) {
    char buf[8192] = {0};
    int n = recv(clientFd, buf, sizeof(buf) - 1, 0);
    if (n <= 0) {
#ifdef _WIN32
        closesocket(clientFd);
#else
        close(clientFd);
#endif
        return;
    }

    Request req = parseRequest(std::string(buf, n));
    Response res = cors(route(req));

    std::ostringstream resp;
    resp << "HTTP/1.1 " << res.status << " OK\r\n";
    for (auto& [k, v] : res.headers)
        resp << k << ": " << v << "\r\n";
    resp << "Content-Length: " << res.body.size() << "\r\n";
    resp << "Connection: close\r\n\r\n";
    resp << res.body;

    std::string out = resp.str();
    send(clientFd, out.c_str(), out.size(), 0);

#ifdef _WIN32
    closesocket(clientFd);
#else
    close(clientFd);
#endif
}

Request HttpServer::parseRequest(const std::string& raw) {
    Request req;
    size_t headerEnd = raw.find("\r\n\r\n");
    std::string headerPart = (headerEnd != std::string::npos) ? raw.substr(0, headerEnd) : raw;
    req.body = (headerEnd != std::string::npos) ? raw.substr(headerEnd + 4) : "";

    std::istringstream ss(headerPart);
    std::string line;
    if (std::getline(ss, line)) {
        std::istringstream rl(line);
        rl >> req.method >> req.path;
        size_t q = req.path.find('?');
        if (q != std::string::npos) {
            req.query = req.path.substr(q + 1);
            req.path = req.path.substr(0, q);
        }
    }
    while (std::getline(ss, line)) {
        size_t colon = line.find(':');
        if (colon != std::string::npos) {
            std::string key = line.substr(0, colon);
            std::string val = line.substr(colon + 1);
            val.erase(0, val.find_first_not_of(" \t"));
            val.erase(val.find_last_not_of("\r\n") + 1);
            req.headers[key] = val;
        }
    }
    return req;
}

Response HttpServer::cors(const Response& res) {
    Response r = res;
    r.headers["Access-Control-Allow-Origin"] = "*";
    r.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    r.headers["Access-Control-Allow-Headers"] = "Content-Type";
    return r;
}

Response HttpServer::route(const Request& req) {
    if (req.method == "OPTIONS") return {200, "{}"};

    std::string path = req.path;

    // GET /api/jobs
    if (req.method == "GET" && path == "/api/jobs") {
        std::string category = "", sort = "";
        // parse query
        std::istringstream qs(req.query);
        std::string pair;
        while (std::getline(qs, pair, '&')) {
            size_t eq = pair.find('=');
            if (eq != std::string::npos) {
                std::string k = pair.substr(0, eq);
                std::string v = pair.substr(eq + 1);
                if (k == "category") category = v;
                if (k == "sort") sort = v;
            }
        }
        auto jobs = db_.getJobs(category, sort);
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < jobs.size(); i++) {
            auto& j = jobs[i];
            if (i) json << ",";
            json << "{\"id\":" << j.id << ",\"title\":\"" << j.title << "\",\"category\":\"" << j.category
                 << "\",\"salary\":\"" << j.salary << "\",\"salary_num\":" << j.salary_num
                 << ",\"location\":\"" << j.location << "\",\"distance\":\"" << j.distance
                 << "\",\"work_time\":\"" << j.work_time << "\",\"duration\":\"" << j.duration
                 << "\",\"headcount\":" << j.headcount << ",\"tags\":\"" << j.tags
                 << "\",\"description\":\"" << j.description << "\",\"requirement\":\"" << j.requirement
                 << "\",\"benefits\":\"" << j.benefits << "\",\"status\":\"" << j.status
                 << "\",\"agent_status\":\"" << j.agent_status << "\",\"views\":" << j.views
                 << ",\"created_at\":\"" << j.created_at << "\"}";
        }
        json << "]";
        return {200, json.str()};
    }

    // GET /api/jobs/:id
    if (req.method == "GET" && path.find("/api/jobs/") == 0) {
        int id = std::stoi(path.substr(10));
        db_.incrementJobViews(id);
        auto j = db_.getJob(id);
        std::ostringstream json;
        json << "{\"id\":" << j.id << ",\"title\":\"" << j.title << "\",\"category\":\"" << j.category
             << "\",\"salary\":\"" << j.salary << "\",\"salary_num\":" << j.salary_num
             << ",\"location\":\"" << j.location << "\",\"distance\":\"" << j.distance
             << "\",\"work_time\":\"" << j.work_time << "\",\"duration\":\"" << j.duration
             << "\",\"headcount\":" << j.headcount << ",\"tags\":\"" << j.tags
             << "\",\"description\":\"" << j.description << "\",\"requirement\":\"" << j.requirement
             << "\",\"benefits\":\"" << j.benefits << "\",\"status\":\"" << j.status
             << "\",\"agent_status\":\"" << j.agent_status << "\",\"views\":" << j.views << "}";
        return {200, json.str()};
    }

    // POST /api/jobs
    if (req.method == "POST" && path == "/api/jobs") {
        // Simplified: parse JSON body
        auto getVal = [](const std::string& body, const std::string& key) -> std::string {
            std::string pat = "\"" + key + "\":";
            size_t pos = body.find(pat);
            if (pos == std::string::npos) return "";
            pos += pat.size();
            while (pos < body.size() && (body[pos] == ' ' || body[pos] == '"')) pos++;
            size_t end = pos;
            while (end < body.size() && body[end] != ',' && body[end] != '}' && body[end] != '"') end++;
            return body.substr(pos, end - pos);
        };

        Job j;
        j.merchant_id = std::stoi(getVal(req.body, "merchant_id"));
        j.title = getVal(req.body, "title");
        j.category = getVal(req.body, "category");
        j.salary = getVal(req.body, "salary");
        j.salary_num = std::stoi(getVal(req.body, "salary_num"));
        j.location = getVal(req.body, "location");
        j.work_time = getVal(req.body, "work_time");
        j.headcount = std::stoi(getVal(req.body, "headcount"));
        j.tags = getVal(req.body, "tags");
        j.description = getVal(req.body, "description");
        j.requirement = getVal(req.body, "requirement");
        j.benefits = getVal(req.body, "benefits");
        j.status = "pending";
        j.agent_status = "pending";

        // Agent审核
        Agent agent(db_);
        auto result = agent.reviewJob(j);
        if (result.flagged) {
            j.status = "rejected";
            j.agent_status = "flagged";
        } else {
            j.status = "open";
            j.agent_status = "approved";
            // 信息补全
            std::string completed = agent.autoComplete(j);
            if (!completed.empty()) j.description += completed;
        }

        int id = db_.createJob(j);
        return {200, "{\"id\":" + std::to_string(id) + ",\"status\":\"" + j.status + "\",\"agent_status\":\"" + j.agent_status + "\"}"};
    }

    // POST /api/applications
    if (req.method == "POST" && path == "/api/applications") {
        auto getVal = [](const std::string& body, const std::string& key) -> std::string {
            std::string pat = "\"" + key + "\":";
            size_t pos = body.find(pat);
            if (pos == std::string::npos) return "";
            pos += pat.size();
            while (pos < body.size() && (body[pos] == ' ' || body[pos] == '"')) pos++;
            size_t end = pos;
            while (end < body.size() && body[end] != ',' && body[end] != '}' && body[end] != '"') end++;
            return body.substr(pos, end - pos);
        };
        Application a;
        a.job_id = std::stoi(getVal(req.body, "job_id"));
        a.student_id = std::stoi(getVal(req.body, "student_id"));
        a.message = getVal(req.body, "message");
        int id = db_.createApplication(a);
        return {200, "{\"id\":" + std::to_string(id) + ",\"status\":\"pending\"}"};
    }

    // PUT /api/applications/:id/status
    if (req.method == "PUT" && path.find("/api/applications/") == 0 && path.find("/status") != std::string::npos) {
        size_t s = path.find("/api/applications/") + 17;
        size_t e = path.find("/status");
        int id = std::stoi(path.substr(s, e - s));
        auto getVal = [](const std::string& body, const std::string& key) -> std::string {
            std::string pat = "\"" + key + "\":";
            size_t pos = body.find(pat);
            if (pos == std::string::npos) return "";
            pos += pat.size();
            while (pos < body.size() && (body[pos] == ' ' || body[pos] == '"')) pos++;
            size_t end = pos;
            while (end < body.size() && body[end] != ',' && body[end] != '}' && body[end] != '"') end++;
            return body.substr(pos, end - pos);
        };
        std::string status = getVal(req.body, "status");
        // 如果录用，自动创建订单
        if (status == "accepted") {
            db_.updateApplicationStatus(id, status);
            // simplified: create order
            return {200, "{\"status\":\"accepted\"}"};
        }
        db_.updateApplicationStatus(id, status);
        return {200, "{\"status\":\"" + status + "\"}"};
    }

    // GET /api/applications?student_id=xxx
    if (req.method == "GET" && path == "/api/applications") {
        auto getVal = [](const std::string& q, const std::string& key) -> std::string {
            std::string pat = key + "=";
            size_t pos = q.find(pat);
            if (pos == std::string::npos) return "";
            pos += pat.size();
            size_t end = q.find('&', pos);
            if (end == std::string::npos) end = q.size();
            return q.substr(pos, end - pos);
        };
        int sid = std::stoi(getVal(req.query, "student_id"));
        auto apps = db_.getApplicationsByStudent(sid);
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < apps.size(); i++) {
            if (i) json << ",";
            json << "{\"id\":" << apps[i].id << ",\"job_id\":" << apps[i].job_id
                 << ",\"status\":\"" << apps[i].status << "\",\"created_at\":\"" << apps[i].created_at << "\"}";
        }
        json << "]";
        return {200, json.str()};
    }

    // GET /api/orders?student_id=xxx
    if (req.method == "GET" && path == "/api/orders") {
        auto getVal = [](const std::string& q, const std::string& key) -> std::string {
            std::string pat = key + "=";
            size_t pos = q.find(pat);
            if (pos == std::string::npos) return "";
            pos += pat.size();
            size_t end = q.find('&', pos);
            if (end == std::string::npos) end = q.size();
            return q.substr(pos, end - pos);
        };
        int sid = std::stoi(getVal(req.query, "student_id"));
        auto orders = db_.getOrdersByStudent(sid);
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < orders.size(); i++) {
            if (i) json << ",";
            json << "{\"id\":" << orders[i].id << ",\"order_no\":\"" << orders[i].order_no
                 << "\",\"job_id\":" << orders[i].job_id << ",\"work_date\":\"" << orders[i].work_date
                 << "\",\"hours\":" << orders[i].hours << ",\"total_amount\":" << orders[i].total_amount
                 << ",\"status\":\"" << orders[i].status << "\"}";
        }
        json << "]";
        return {200, json.str()};
    }

    // GET /api/agent/logs
    if (req.method == "GET" && path == "/api/agent/logs") {
        auto logs = db_.getAgentLogs(20);
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < logs.size(); i++) {
            if (i) json << ",";
            json << "{\"id\":" << logs[i].id << ",\"action_type\":\"" << logs[i].action_type
                 << "\",\"title\":\"" << logs[i].title << "\",\"description\":\"" << logs[i].description
                 << "\",\"created_at\":\"" << logs[i].created_at << "\"}";
        }
        json << "]";
        return {200, json.str()};
    }

    return {404, "{\"error\":\"Not Found\"}"};
}
