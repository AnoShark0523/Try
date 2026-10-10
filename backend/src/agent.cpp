#include "agent.h"
#include <algorithm>
#include <sstream>
#include <ctime>
#include <iomanip>

Agent::Agent(Database& db) : db_(db) {}

ReviewResult Agent::reviewJob(const Job& job) {
    ReviewResult result;
    std::string text = job.title + " " + job.description + " " + job.requirement + " " + job.tags;

    for (const auto& kw : violationKeywords) {
        if (text.find(kw) != std::string::npos) {
            result.flagged = true;
            result.violations.push_back(kw);
        }
    }

    for (const auto& pat : suspiciousPatterns) {
        if (text.find(pat) != std::string::npos) {
            result.flagged = true;
            result.violations.push_back(pat);
        }
    }

    // 薪资异常检测
    if (job.salary_num > 500) {
        result.flagged = true;
        result.violations.push_back("薪资异常（>" + std::to_string(job.salary_num) + "元/天）");
    }

    if (result.flagged) {
        std::ostringstream ss;
        ss << "检测到违规内容：";
        for (size_t i = 0; i < result.violations.size(); i++) {
            if (i) ss << "、";
            ss << result.violations[i];
        }
        result.reason = ss.str();

        AgentLog log;
        log.action_type = "review";
        log.target_type = "job";
        log.target_id = job.id;
        log.title = "岗位违规审核";
        log.description = "「" + job.title + "」" + result.reason + "，已自动下线。";
        db_.createAgentLog(log);
    } else {
        AgentLog log;
        log.action_type = "review";
        log.target_type = "job";
        log.target_id = job.id;
        log.title = "岗位违规审核";
        log.description = "「" + job.title + "」审核通过，无违规内容。";
        db_.createAgentLog(log);
    }

    return result;
}

CompleteResult Agent::autoComplete(const Job& job) {
    CompleteResult result;

    std::map<std::string, std::string> templates = {
        {"餐饮", "工作内容包含点单服务、餐品制作、收银结算、台面清洁，需保持食品安全卫生标准。"},
        {"咖啡", "工作内容包含饮品制作、收银操作、台面清洁，需保持卫生标准。"},
        {"导购", "工作内容包含商品展示、顾客引导、试衣协助、库存盘点。"},
        {"家教", "工作内容包含课前备课、知识点讲解、课后作业批改、定期学习反馈。"},
        {"配送", "工作内容包含订单接收、取餐配送、异常处理，需熟悉周边路线。"},
        {"设计", "工作内容包含素材收集、排版设计、配图处理、稿件修改迭代。"},
        {"技术", "工作内容包含设备调试、Demo演示、技术答疑，需了解相关技术基础。"},
        {"活动", "工作内容包含签到引导、物料分发、现场秩序维护。"},
    };

    for (auto& [kw, tmpl] : templates) {
        if (job.title.find(kw) != std::string::npos || job.description.find(kw) != std::string::npos) {
            if (job.description.length() < 20) {
                result.supplemented = tmpl;
                break;
            }
        }
    }

    if (job.tags.empty()) {
        result.suggestions.push_back("建议添加标签：包餐、就近、日结");
    }
    if (job.requirement.empty()) {
        result.suggestions.push_back("建议补充任职要求");
    }

    if (!result.supplemented.empty() || !result.suggestions.empty()) {
        AgentLog log;
        log.action_type = "complete";
        log.target_type = "job";
        log.target_id = job.id;
        log.title = "信息自动补全";
        std::ostringstream ss;
        ss << "「" << job.title << "」";
        if (!result.supplemented.empty()) ss << "已补全描述：" << result.supplemented << "。";
        if (!result.suggestions.empty()) {
            ss << "建议：";
            for (size_t i = 0; i < result.suggestions.size(); i++) {
                if (i) ss << "、";
                ss << result.suggestions[i];
            }
        }
        log.description = ss.str();
        db_.createAgentLog(log);
    }

    return result;
}

RecommendResult Agent::recommendJobs(int studentId, int limit) {
    RecommendResult result;

    // 基于学生历史投递记录推荐
    auto apps = db_.getApplicationsByStudent(studentId);

    // 统计投递分类偏好
    std::map<std::string, int> categoryScores;
    for (auto& a : apps) {
        auto job = db_.getJob(a.job_id);
        categoryScores[job.category]++;
    }

    // 获取所有在招岗位
    auto allJobs = db_.getJobs();

    // 计算匹配分
    std::vector<std::pair<int, double>> scores;
    for (auto& j : allJobs) {
        double score = 0;
        // 分类偏好加分
        if (categoryScores.count(j.category))
            score += categoryScores[j.category] * 30;
        // 薪资加分
        score += std::min(j.salary_num / 10.0, 10.0);
        // 距离加分
        if (!j.distance.empty()) {
            size_t kmPos = j.distance.find("km");
            if (kmPos != std::string::npos) {
                std::string distStr = j.distance.substr(0, kmPos);
                try {
                    double dist = std::stod(distStr);
                    score += std::max(0.0, 20.0 - dist * 5);
                } catch (...) {}
            }
        }
        // 热度加分
        score += std::min(j.views / 50.0, 10.0);
        scores.push_back({j.id, score});
    }

    // 按分排序
    std::sort(scores.begin(), scores.end(), [](auto& a, auto& b) { return a.second > b.second; });

    int count = std::min(limit, (int)scores.size());
    for (int i = 0; i < count; i++) {
        result.jobIds.push_back(scores[i].first);
    }

    std::ostringstream ss;
    ss << "根据学生画像（历史投递" << apps.size() << "次），推荐Top" << count << "岗位，匹配度"
       << (scores.empty() ? 0 : scores[0].second) << "%。";
    result.reason = ss.str();

    AgentLog log;
    log.action_type = "recommend";
    log.target_type = "user";
    log.target_id = studentId;
    log.title = "智能推荐增强";
    log.description = result.reason;
    db_.createAgentLog(log);

    return result;
}
