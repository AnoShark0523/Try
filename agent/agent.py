# -*- coding: utf-8 -*-
"""
大学生周末兼职撮合平台 - 轻量化 Agent 辅助模块
负责三大核心功能：
1. 岗位违规审核（关键词匹配 + 规则引擎）
2. 信息自动补全（模板匹配 + 知识库）
3. 智能推荐增强（基于学生画像的协同过滤）
"""

import json
import sqlite3
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple

# ==================== 违规关键词库 ====================
VIOLATION_KEYWORDS = [
    "刷单", "刷量", "高额返利", "日入过千", "轻松赚钱",
    "赌博", "色情", "代写论文", "传销", "走私",
    "兼职刷信誉", "打字员日入", "网络兼职日结",
]

SUSPICIOUS_PATTERNS = [
    "先交钱", "押金", "培训费", "服装费", "保证金",
    "会费", "入职费", "卡费",
]

SALARY_ANOMALY_THRESHOLD = 500  # 日薪超过500元标记异常

# ==================== 补全知识库 ====================
COMPLETION_TEMPLATES = {
    "餐饮": "工作内容包含点单服务、餐品制作、收银结算、台面清洁，需保持食品安全卫生标准。",
    "咖啡": "工作内容包含饮品制作、收银操作、台面清洁，需保持卫生标准。",
    "奶茶": "工作内容包含点单、饮品制作、收银、店面清洁。",
    "导购": "工作内容包含商品展示、顾客引导、试衣协助、库存盘点。",
    "家教": "工作内容包含课前备课、知识点讲解、课后作业批改、定期学习反馈。",
    "配送": "工作内容包含订单接收、取餐配送、异常处理，需熟悉周边路线。",
    "设计": "工作内容包含素材收集、排版设计、配图处理、稿件修改迭代。",
    "技术": "工作内容包含设备调试、Demo演示、技术答疑，需了解相关技术基础。",
    "活动": "工作内容包含签到引导、物料分发、现场秩序维护。",
    "展会": "工作内容包含展位引导、签到登记、设备协助。",
}

TAG_SUGGESTIONS = {
    "餐饮服务": ["包餐", "就近", "日结", "弹性排班"],
    "零售导购": ["日结", "培训上岗", "员工折扣"],
    "家教辅导": ["长期", "薪资周结", "线上"],
    "配送物流": ["日结", "提供装备", "高峰补贴"],
    "活动协助": ["包餐", "大巴接送", "志愿证明"],
    "设计排版": ["线上", "灵活", "长期"],
    "技术支持": ["包餐", "技术证明", "拓展人脉"],
}


class Agent:
    def __init__(self, db_path: str = "platform.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

    def close(self):
        self.conn.close()

    def _log(self, action_type: str, target_type: str, target_id: int, title: str, desc: str):
        self.conn.execute(
            "INSERT INTO agent_logs (action_type, target_type, target_id, title, description) VALUES (?,?,?,?,?)",
            (action_type, target_type, target_id, title, desc)
        )
        self.conn.commit()

    # ==================== 1. 岗位违规审核 ====================
    def review_job(self, job: Dict) -> Dict:
        text = f"{job.get('title','')} {job.get('description','')} {job.get('requirement','')} {job.get('tags','')}"
        violations = []

        for kw in VIOLATION_KEYWORDS:
            if kw in text:
                violations.append(kw)

        for pat in SUSPICIOUS_PATTERNS:
            if pat in text:
                violations.append(pat)

        salary = job.get("salary_num", 0)
        try:
            salary = int(salary)
        except (ValueError, TypeError):
            salary = 0
        if salary > SALARY_ANOMALY_THRESHOLD:
            violations.append(f"薪资异常（>{salary}元/天）")

        flagged = len(violations) > 0
        reason = f"检测到违规内容：{'、'.join(violations)}" if violations else "审核通过，无违规内容。"

        self._log("review", "job", job.get("id", 0), "岗位违规审核",
                  f"「{job.get('title','')}」{reason}")

        return {"flagged": flagged, "violations": violations, "reason": reason}

    # ==================== 2. 信息自动补全 ====================
    def auto_complete(self, job: Dict) -> Dict:
        supplemented = ""
        suggestions = []

        title = job.get("title", "")
        desc = job.get("description", "")
        category = job.get("category", "")
        tags = job.get("tags", "")

        for keyword, template in COMPLETION_TEMPLATES.items():
            if keyword in title or keyword in desc:
                if len(desc) < 20:
                    supplemented = template
                break

        if not tags or len(tags.split(",")) < 2:
            suggested_tags = TAG_SUGGESTIONS.get(category, ["日结", "就近"])
            suggestions.append(f"建议添加标签：{','.join(suggested_tags)}")

        if not job.get("requirement"):
            suggestions.append("建议补充任职要求")

        if not job.get("benefits"):
            suggestions.append("建议补充福利待遇")

        if supplemented or suggestions:
            parts = [f"「{title}」"]
            if supplemented:
                parts.append(f"已补全描述：{supplemented}")
            if suggestions:
                parts.append("建议：" + "；".join(suggestions))
            self._log("complete", "job", job.get("id", 0), "信息自动补全", "".join(parts))

        return {"supplemented": supplemented, "suggestions": suggestions}

    # ==================== 3. 智能推荐增强 ====================
    def recommend_jobs(self, student_id: int, limit: int = 10) -> Dict:
        cursor = self.conn.cursor()

        cursor.execute(
            "SELECT j.category FROM applications a JOIN jobs j ON a.job_id=j.id WHERE a.student_id=?",
            (student_id,)
        )
        category_scores: Dict[str, int] = {}
        for row in cursor:
            cat = row["category"]
            category_scores[cat] = category_scores.get(cat, 0) + 1

        cursor.execute(
            "SELECT id, title, category, salary_num, location, distance, tags, views FROM jobs WHERE status IN('open','urgent')"
        )
        all_jobs = [dict(row) for row in cursor.fetchall()]

        scored: List[Tuple[int, float]] = []
        for j in all_jobs:
            score = 0.0
            if j["category"] in category_scores:
                score += category_scores[j["category"]] * 30
            try:
                score += min(int(j["salary_num"]) / 10.0, 10.0)
            except (ValueError, TypeError):
                pass
            dist_str = j["distance"] or ""
            km_match = re.match(r"([\d.]+)", dist_str)
            if km_match:
                dist = float(km_match.group(1))
                score += max(0.0, 20.0 - dist * 5)
            score += min(j["views"] / 50.0, 10.0)
            scored.append((j["id"], round(score, 1)))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:limit]

        reason = f"根据学生画像（历史投递{len(category_scores)}类岗位），推荐Top{len(top)}岗位。"
        self._log("recommend", "user", student_id, "智能推荐增强", reason)

        return {"job_ids": [jid for jid, _ in top], "scores": top, "reason": reason}

    # ==================== 批量处理 ====================
    def run_batch(self):
        """批量审核所有pending状态的岗位"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE agent_status='pending'")
        jobs = [dict(row) for row in cursor.fetchall()]

        results = []
        for job in jobs:
            review = self.review_job(job)
            complete = self.auto_complete(job)

            if review["flagged"]:
                cursor.execute(
                    "UPDATE jobs SET status='rejected', agent_status='flagged', agent_note=? WHERE id=?",
                    (review["reason"], job["id"])
                )
            else:
                new_desc = job["description"]
                if complete["supplemented"]:
                    new_desc += complete["supplemented"]
                cursor.execute(
                    "UPDATE jobs SET status='open', agent_status='approved', description=?, agent_note='审核通过' WHERE id=?",
                    (new_desc, job["id"])
                )
            results.append({"job_id": job["id"], "flagged": review["flagged"]})

        self.conn.commit()
        return results

    def get_stats(self) -> Dict:
        cursor = self.conn.cursor()
        stats = {}
        for action in ["review", "complete", "recommend"]:
            cursor.execute("SELECT COUNT(*) as cnt FROM agent_logs WHERE action_type=?", (action,))
            stats[action] = cursor.fetchone()["cnt"]
        return stats

    def get_logs(self, limit: int = 20) -> List[Dict]:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        return [dict(row) for row in cursor.fetchall()]


# ==================== CLI 入口 ====================
if __name__ == "__main__":
    import sys

    db_path = sys.argv[1] if len(sys.argv) > 1 else "platform.db"
    agent = Agent(db_path)

    print("=" * 60)
    print("  大学生周末兼职撮合平台 - Agent 辅助模块")
    print("=" * 60)

    while True:
        print("\n请选择操作：")
        print("1. 批量审核待处理岗位")
        print("2. 查看Agent统计")
        print("3. 查看Agent日志")
        print("4. 智能推荐（输入学生ID）")
        print("5. 退出")
        choice = input("\n> ").strip()

        if choice == "1":
            results = agent.run_batch()
            print(f"\n✅ 批量审核完成，共处理 {len(results)} 个岗位")
            for r in results:
                status = "❌ 违规下线" if r["flagged"] else "✅ 审核通过"
                print(f"  岗位ID {r['job_id']}: {status}")
        elif choice == "2":
            stats = agent.get_stats()
            print(f"\n📊 Agent 统计：")
            print(f"  违规审核: {stats['review']} 次")
            print(f"  信息补全: {stats['complete']} 次")
            print(f"  智能推荐: {stats['recommend']} 次")
        elif choice == "3":
            logs = agent.get_logs(10)
            print(f"\n📋 Agent 日志（最近10条）：")
            for log in logs:
                print(f"  [{log['created_at']}] {log['title']}: {log['description']}")
        elif choice == "4":
            sid = input("请输入学生ID: ").strip()
            try:
                result = agent.recommend_jobs(int(sid))
                print(f"\n🎯 {result['reason']}")
                for jid, score in result["scores"]:
                    print(f"  岗位ID {jid}: 匹配分 {score}")
            except ValueError:
                print("⚠️ 无效的学生ID")
        elif choice == "5":
            agent.close()
            print("再见！")
            break
        else:
            print("无效选择，请重试。")
