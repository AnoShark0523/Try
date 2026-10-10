#pragma once
#include "database.h"
#include "models.h"
#include <string>
#include <vector>

struct ReviewResult {
    bool flagged = false;
    std::string reason;
    std::vector<std::string> violations;
};

struct CompleteResult {
    std::string supplemented;
    std::vector<std::string> suggestions;
};

struct RecommendResult {
    std::vector<int> jobIds;
    std::string reason;
};

class Agent {
public:
    Agent(Database& db);

    // 岗位违规审核
    ReviewResult reviewJob(const Job& job);

    // 信息自动补全
    CompleteResult autoComplete(const Job& job);

    // 智能推荐增强
    RecommendResult recommendJobs(int studentId, int limit = 10);

private:
    Database& db_;
    const std::vector<std::string> violationKeywords = {
        "刷单", "刷量", "高额返利", "日入过千", "轻松赚钱",
        "赌博", "色情", "代写论文", "传销", "走私"
    };
    const std::vector<std::string> suspiciousPatterns = {
        "先交钱", "押金", "培训费", "服装费", "保证金"
    };
};
