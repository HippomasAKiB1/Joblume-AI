import aiohttp
import json
from typing import Optional
from app.core.config import settings


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def _call_openrouter(messages: list[dict], temperature: float = 0.7) -> str:
    """Make a request to OpenRouter API and return the response text."""
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.FRONTEND_URL,
        "X-Title": "JobLume AI",
    }

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "temperature": temperature,
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(OPENROUTER_URL, headers=headers, json=payload) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise Exception(f"OpenRouter API error ({resp.status}): {error_text}")
            data = await resp.json()
            return data["choices"][0]["message"]["content"]


def _format_resume_data(json_data: dict) -> str:
    """Format resume JSON data into readable text for AI prompts."""
    sections = []

    personal = json_data.get("personalInfo", {})
    if personal:
        sections.append(f"Name: {personal.get('fullName', 'N/A')}")
        sections.append(f"Email: {personal.get('email', '')}")
        sections.append(f"Phone: {personal.get('phone', '')}")
        sections.append(f"Location: {personal.get('location', '')}")

    summary = json_data.get("summary", "")
    if summary:
        sections.append(f"\nProfessional Summary:\n{summary}")

    education = json_data.get("education", [])
    if education:
        sections.append("\nEducation:")
        for edu in education:
            sections.append(f"- {edu.get('degree', '')} at {edu.get('institution', '')} ({edu.get('startDate', '')} - {edu.get('endDate', '')})")

    experience = json_data.get("experience", [])
    if experience:
        sections.append("\nExperience:")
        for exp in experience:
            sections.append(f"- {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('startDate', '')} - {exp.get('endDate', '')})")
            for bullet in exp.get("bullets", []):
                sections.append(f"  • {bullet}")

    projects = json_data.get("projects", [])
    if projects:
        sections.append("\nProjects:")
        for proj in projects:
            sections.append(f"- {proj.get('name', '')}: {proj.get('description', '')}")

    skills = json_data.get("skills", [])
    if skills:
        sections.append(f"\nSkills: {', '.join(skills)}")

    certifications = json_data.get("certifications", [])
    if certifications:
        sections.append("\nCertifications:")
        for cert in certifications:
            sections.append(f"- {cert.get('name', '')} by {cert.get('issuer', '')} ({cert.get('date', '')})")

    languages = json_data.get("languages", [])
    if languages:
        sections.append(f"\nLanguages: {', '.join([l.get('name', '') + ' (' + l.get('level', '') + ')' for l in languages])}")

    awards = json_data.get("awards", [])
    if awards:
        sections.append("\nAwards:")
        for award in awards:
            sections.append(f"- {award.get('title', '')} ({award.get('date', '')})")

    return "\n".join(sections)


async def tailor_resume(resume_json: dict, job_description: str) -> dict:
    """Compare resume against job description and return optimization suggestions."""
    resume_text = _format_resume_data(resume_json)

    messages = [
        {
            "role": "system",
            "content": """You are an expert career advisor and resume optimization specialist. 
Analyze the resume against the job description and provide actionable feedback.
You MUST respond in valid JSON format with exactly these keys:
{
  "match_score": <integer 0-100>,
  "missing_keywords": [<list of important keywords from the JD not in the resume>],
  "optimized_summary": "<rewritten professional summary tailored to this job>",
  "improved_bullets": [<list of 3-5 improved experience bullet points>],
  "suggested_skills": [<list of skills to add based on JD>]
}"""
        },
        {
            "role": "user",
            "content": f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}"
        }
    ]

    response = await _call_openrouter(messages, temperature=0.4)

    try:
        # Try to parse JSON from the response
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(response[start:end])
    except json.JSONDecodeError:
        pass

    return {
        "match_score": 50,
        "missing_keywords": ["Unable to parse AI response"],
        "optimized_summary": response[:500],
        "improved_bullets": [],
        "suggested_skills": []
    }


async def generate_cover_letter(resume_json: dict, job_title: str, company_name: str, job_description: str) -> str:
    """Generate a tailored cover letter based on resume and job details."""
    resume_text = _format_resume_data(resume_json)

    messages = [
        {
            "role": "system",
            "content": """You are an expert cover letter writer. Write a professional, concise, 
and compelling cover letter that highlights the candidate's relevant qualifications. 
The letter should be 3-4 paragraphs, formal but personable, and specifically tailored to the job.
Do not include placeholders like [Your Name] - use the actual data provided."""
        },
        {
            "role": "user",
            "content": f"""Write a cover letter for the following:

Position: {job_title}
Company: {company_name}

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}"""
        }
    ]

    return await _call_openrouter(messages, temperature=0.6)


async def analyze_resume_ats(resume_json: dict) -> dict:
    """Use AI to provide ATS analysis and improvement suggestions."""
    resume_text = _format_resume_data(resume_json)

    messages = [
        {
            "role": "system",
            "content": """You are an ATS (Applicant Tracking System) expert. Analyze this resume for ATS compatibility.
You MUST respond in valid JSON format with exactly these keys:
{
  "score": <integer 0-100>,
  "formatting_issues": [<list of formatting problems>],
  "missing_keywords": [<list of commonly expected keywords that are missing>],
  "weak_verbs": [<list of weak action verbs found with suggested replacements>],
  "improvement_tips": [<list of 3-5 actionable tips to improve ATS score>]
}"""
        },
        {
            "role": "user",
            "content": f"Analyze this resume for ATS compatibility:\n\n{resume_text}"
        }
    ]

    response = await _call_openrouter(messages, temperature=0.3)

    try:
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(response[start:end])
    except json.JSONDecodeError:
        pass

    return {
        "score": 50,
        "formatting_issues": ["Unable to parse AI response"],
        "missing_keywords": [],
        "weak_verbs": [],
        "improvement_tips": [response[:500]]
    }


async def enhance_summary(resume_json: dict) -> str:
    """Generate an enhanced professional summary using AI."""
    resume_text = _format_resume_data(resume_json)

    messages = [
        {
            "role": "system",
            "content": """You are an expert resume writer. Write a powerful, concise professional summary 
(2-3 sentences) that highlights the candidate's strongest qualifications, key achievements, 
and value proposition. Use strong action-oriented language and be specific."""
        },
        {
            "role": "user",
            "content": f"Write a professional summary for this candidate:\n\n{resume_text}"
        }
    ]

    return await _call_openrouter(messages, temperature=0.5)
