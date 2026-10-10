#pragma once
#include <string>
#include <vector>
#include <map>

struct User {
    int id = 0;
    std::string phone;
    std::string password;
    std::string role;
    std::string name;
    std::string university;
    std::string major;
    std::string grade;
    std::string merchant_name;
    std::string merchant_addr;
    int credit_score = 100;
    std::string created_at;
};

struct Job {
    int id = 0;
    int merchant_id = 0;
    std::string title;
    std::string category;
    std::string salary;
    int salary_num = 0;
    std::string location;
    std::string distance;
    std::string work_time;
    std::string duration;
    int headcount = 1;
    std::string tags;
    std::string description;
    std::string requirement;
    std::string benefits;
    std::string status;
    std::string agent_status;
    std::string agent_note;
    int views = 0;
    std::string created_at;
};

struct Application {
    int id = 0;
    int job_id = 0;
    int student_id = 0;
    std::string message;
    std::string status;
    std::string created_at;
    std::string updated_at;
};

struct Order {
    int id = 0;
    std::string order_no;
    int job_id = 0;
    int application_id = 0;
    int student_id = 0;
    int merchant_id = 0;
    std::string work_date;
    double hours = 0;
    double unit_salary = 0;
    double total_amount = 0;
    std::string status;
    std::string created_at;
};

struct AgentLog {
    int id = 0;
    std::string action_type;
    std::string target_type;
    int target_id = 0;
    std::string title;
    std::string description;
    std::string created_at;
};
