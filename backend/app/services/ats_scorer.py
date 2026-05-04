"""
Deterministic ATS scoring engine.
Provides a baseline score without relying on AI API calls.
"""

import re
from typing import Any

# Common strong action verbs for resume scoring
STRONG_ACTION_VERBS = {
    "achieved", "accelerated", "accomplished", "administered", "advanced",
    "analyzed", "architected", "automated", "built", "championed",
    "consolidated", "coordinated", "created", "decreased", "delivered",
    "designed", "developed", "directed", "drove", "eliminated",
    "engineered", "established", "executed", "expanded", "generated",
    "grew", "headed", "implemented", "improved", "increased",
    "influenced", "initiated", "innovated", "integrated", "launched",
    "led", "managed", "maximized", "mentored", "negotiated",
    "optimized", "orchestrated", "organized", "oversaw", "pioneered",
    "planned", "produced", "programmed", "projected", "reduced",
    "redesigned", "resolved", "restructured", "revamped", "revolutionized",
    "scaled", "secured", "simplified", "spearheaded", "streamlined",
    "strengthened", "supervised", "surpassed", "transformed", "unified",
}

WEAK_VERBS = {
    "helped", "assisted", "worked", "did", "made", "got",
    "handled", "was responsible for", "participated", "tried",
    "used", "utilized", "involved in", "tasked with",
}

# Common ATS keywords across industries
COMMON_ATS_KEYWORDS = {
    "leadership", "communication", "problem-solving", "teamwork",
    "project management", "strategic planning", "data analysis",
    "budget", "stakeholder", "cross-functional", "agile", "scrum",
    "metrics", "kpi", "roi", "revenue", "optimization",
    "collaboration", "innovation", "deadline", "deliverables",
}

REQUIRED_SECTIONS = [
    "personalInfo", "summary", "education", "experience", "skills"
]

RECOMMENDED_SECTIONS = [
    "projects", "certifications", "languages", "awards"
]


def score_resume(json_data: dict) -> dict:
    """
    Calculate a deterministic ATS score for the resume data.
    Returns score (0-100) and detailed feedback.
    """
    score = 0
    max_score = 100
    formatting_issues = []
    missing_keywords_list = []
    weak_verbs_found = []
    improvement_tips = []

    # ── Section Completeness (30 points) ──────────────────────
    section_score = 0
    for section in REQUIRED_SECTIONS:
        data = json_data.get(section)
        if data and (isinstance(data, str) and len(data.strip()) > 0 or
                     isinstance(data, list) and len(data) > 0 or
                     isinstance(data, dict) and any(v for v in data.values())):
            section_score += 4
        else:
            formatting_issues.append(f"Missing required section: {section}")

    for section in RECOMMENDED_SECTIONS:
        data = json_data.get(section)
        if data and (isinstance(data, list) and len(data) > 0):
            section_score += 2.5
        else:
            improvement_tips.append(f"Consider adding a '{section}' section to strengthen your resume")

    score += min(section_score, 30)

    # ── Personal Info Quality (10 points) ─────────────────────
    personal = json_data.get("personalInfo", {})
    pi_score = 0
    required_pi = ["fullName", "email", "phone", "location"]
    for field in required_pi:
        if personal.get(field, "").strip():
            pi_score += 2.5
        else:
            formatting_issues.append(f"Missing personal info: {field}")

    score += pi_score

    # ── Summary Quality (10 points) ───────────────────────────
    summary = json_data.get("summary", "")
    if summary:
        word_count = len(summary.split())
        if 20 <= word_count <= 80:
            score += 10
        elif word_count < 20:
            score += 5
            improvement_tips.append("Professional summary is too short. Aim for 30-60 words.")
        else:
            score += 7
            improvement_tips.append("Professional summary is too long. Keep it concise (30-60 words).")
    else:
        improvement_tips.append("Add a professional summary to give recruiters a quick overview.")

    # ── Experience Quality (25 points) ────────────────────────
    experience = json_data.get("experience", [])
    exp_score = 0

    if experience:
        exp_score += 5  # Has experience section

        all_bullets = []
        for exp in experience:
            bullets = exp.get("bullets", [])
            all_bullets.extend(bullets)

            if not exp.get("title"):
                formatting_issues.append("An experience entry is missing a job title")
            if not exp.get("company"):
                formatting_issues.append("An experience entry is missing a company name")

        # Check bullet quantity
        if len(all_bullets) >= 6:
            exp_score += 5
        elif len(all_bullets) >= 3:
            exp_score += 3
            improvement_tips.append("Add more bullet points to your experience (aim for 3-5 per role).")
        else:
            improvement_tips.append("Add descriptive bullet points to your experience entries.")

        # Check action verbs
        strong_count = 0
        for bullet in all_bullets:
            first_word = bullet.strip().split()[0].lower().rstrip("ed").rstrip("ing") if bullet.strip() else ""
            full_first = bullet.strip().split()[0].lower() if bullet.strip() else ""

            if full_first in STRONG_ACTION_VERBS:
                strong_count += 1

            if full_first in WEAK_VERBS:
                weak_verbs_found.append(f"'{full_first}' → Consider using a stronger verb")

        if strong_count >= len(all_bullets) * 0.5:
            exp_score += 5
        elif strong_count > 0:
            exp_score += 3
            improvement_tips.append("Start more bullet points with strong action verbs (achieved, implemented, drove, etc.)")

        # Check for quantified impact
        quantified = sum(1 for b in all_bullets if re.search(r'\d+[%$]?|\$\d+', b))
        if quantified >= len(all_bullets) * 0.3:
            exp_score += 5
        elif quantified > 0:
            exp_score += 3
            improvement_tips.append("Quantify more achievements with numbers, percentages, or dollar amounts.")
        else:
            improvement_tips.append("Add quantified achievements (e.g., 'Increased revenue by 25%').")

        exp_score += min(5, len(all_bullets))  # Up to 5 more for depth

    else:
        improvement_tips.append("Add work experience to demonstrate your professional background.")

    score += min(exp_score, 25)

    # ── Skills Quality (15 points) ────────────────────────────
    skills = json_data.get("skills", [])
    skills_score = 0

    if skills:
        if len(skills) >= 8:
            skills_score += 10
        elif len(skills) >= 5:
            skills_score += 7
            improvement_tips.append("Add more relevant skills (aim for 8-12).")
        elif len(skills) >= 3:
            skills_score += 5
            improvement_tips.append("Your skills section is light. Add more relevant skills.")
        else:
            skills_score += 3
            improvement_tips.append("List at least 5-8 relevant skills for ATS matching.")

        # Check against common keywords
        skills_lower = {s.lower() for s in skills}
        resume_text_lower = str(json_data).lower()
        for keyword in COMMON_ATS_KEYWORDS:
            if keyword not in resume_text_lower:
                missing_keywords_list.append(keyword)

        if len(missing_keywords_list) < 5:
            skills_score += 5
        elif len(missing_keywords_list) < 10:
            skills_score += 3
    else:
        improvement_tips.append("Add a skills section — this is critical for ATS matching.")
        missing_keywords_list = list(COMMON_ATS_KEYWORDS)[:8]

    score += min(skills_score, 15)

    # ── Education Quality (10 points) ─────────────────────────
    education = json_data.get("education", [])
    if education:
        edu_score = 5
        for edu in education:
            if edu.get("degree") and edu.get("institution"):
                edu_score += 2.5
        score += min(edu_score, 10)
    else:
        formatting_issues.append("Missing education section")
        improvement_tips.append("Add your education background.")

    # Clamp score
    final_score = max(0, min(int(score), max_score))

    # Trim lists
    missing_keywords_list = missing_keywords_list[:10]
    weak_verbs_found = weak_verbs_found[:5]

    if not improvement_tips:
        improvement_tips.append("Your resume looks great! Keep it updated with your latest achievements.")

    return {
        "score": final_score,
        "formatting_issues": formatting_issues[:8],
        "missing_keywords": missing_keywords_list,
        "weak_verbs": weak_verbs_found,
        "improvement_tips": improvement_tips[:6],
    }
