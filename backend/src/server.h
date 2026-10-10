#pragma once
#include "database.h"
#include <string>
#include <functional>

struct Request {
    std::string method;
    std::string path;
    std::string query;
    std::string body;
    std::map<std::string, std::string> headers;
};

struct Response {
    int status = 200;
    std::string body;
    std::map<std::string, std::string> headers = {{"Content-Type", "application/json; charset=utf-8"}};
};

class HttpServer {
public:
    HttpServer(int port, Database& db);
    void start();
    void stop();

private:
    int port_;
    Database& db_;
    int server_fd_ = -1;
    bool running_ = false;
    void handleClient(int clientFd);
    Request parseRequest(const std::string& raw);
    Response route(const Request& req);
    Response cors(const Response& res);
};
