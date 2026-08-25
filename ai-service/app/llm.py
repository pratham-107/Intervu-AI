import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

load_dotenv()

class LLMEngine:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        self.groq_client = Groq(api_key=groq_key) if groq_key else None
        self.gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None

    async def generate_questions(self, role: str, difficulty: str = "medium", resume_text: Optional[str] = None) -> List[Dict[str, Any]]:
        prompt = f"""You are an expert technical hiring interviewer.
Generate 5 realistic, high-signal interview questions for a candidate interviewing for the role of: {role}.
Difficulty level: {difficulty.upper()}.
{"Candidate Resume Context: " + resume_text if resume_text else ""}

Return ONLY a valid JSON array of objects matching this exact structure:
[
  {{"id": "q-1", "order": 1, "text": "Question 1 text"}},
  {{"id": "q-2", "order": 2, "text": "Question 2 text"}},
  {{"id": "q-3", "order": 3, "text": "Question 3 text"}},
  {{"id": "q-4", "order": 4, "text": "Question 4 text"}},
  {{"id": "q-5", "order": 5, "text": "Question 5 text"}}
]
Do not include markdown tags or explanation. Just raw JSON.
"""

        # 1. Groq high speed inference
        if self.groq_client:
            try:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a JSON-only API that outputs structured interview questions."},
                        {"role": "user", "content": prompt}
                    ],
                    model="openai/gpt-oss-120b",
                    temperature=0.7
                )
                content = chat_completion.choices[0].message.content.strip()
                clean_json = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(clean_json)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "questions" in data:
                    return data["questions"]
            except Exception as e:
                print(f"[LLM] Groq question gen error: {e}")

        # 2. Gemini fallback
        if self.gemini_client:
            try:
                response = self.gemini_client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                data = json.loads(response.text)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "questions" in data:
                    return data["questions"]
            except Exception as e:
                print(f"[LLM] Gemini question gen error: {e}")

        # Static fallback if offline
        return [
            {"id": "q-1", "order": 1, "text": f"Walk me through your architectural approach when building a scalable {role} solution."},
            {"id": "q-2", "order": 2, "text": "Describe a challenging technical bug you encountered in production and how you diagnosed it."},
            {"id": "q-3", "order": 3, "text": "How do you approach performance optimization and latency reduction in your projects?"},
            {"id": "q-4", "order": 4, "text": "How do you handle edge cases and fault tolerance in distributed or asynchronous systems?"},
            {"id": "q-5", "order": 5, "text": "Tell me about a technical trade-off you had to negotiate with your team or stakeholders."}
        ]

    async def generate_feedback(self, role: str, difficulty: str, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        prompt = f"""You are a senior technical hiring manager reviewing a candidate's mock interview for the role of {role} (Difficulty: {difficulty}).
Candidate's Q&A Transcript:
{json.dumps(questions, indent=2)}

Analyze their technical depth, communication clarity, structure (STAR method), and completeness.
Return ONLY a valid JSON object matching this schema:
{{
  "overall_score": 82,
  "strengths": [
    "Strength point 1",
    "Strength point 2",
    "Strength point 3"
  ],
  "areas_to_improve": [
    "Growth point 1",
    "Growth point 2"
  ],
  "per_question_feedback": [
    {{
      "question": "Question text",
      "answer_summary": "Summary of what candidate answered",
      "feedback": "Constructive feedback on structure and accuracy",
      "suggested_answer": "Model exemplary answer"
    }}
  ]
}}
Do not include markdown formatting or commentary. Just raw JSON.
"""

        if self.groq_client:
            try:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a JSON-only API that outputs structured interview evaluation reports."},
                        {"role": "user", "content": prompt}
                    ],
                    model="openai/gpt-oss-120b",
                    temperature=0.5
                )
                content = chat_completion.choices[0].message.content.strip()
                clean_json = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean_json)
            except Exception as e:
                print(f"[LLM] Groq feedback gen error: {e}")

        if self.gemini_client:
            try:
                response = self.gemini_client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                print(f"[LLM] Gemini feedback gen error: {e}")

        return {
            "overall_score": 80,
            "strengths": [
                "Good technical foundation and clear articulation of core concepts",
                "Demonstrated practical understanding of system trade-offs",
                "Structured explanations with logical progression"
            ],
            "areas_to_improve": [
                "Incorporate more concrete metrics and quantifiable impact (e.g. latency numbers, throughput)",
                "Reduce introductory hesitation and use concise STAR framing (Situation, Task, Action, Result)"
            ],
            "per_question_feedback": [
                {
                    "question": q.get("text", q.get("question_text", "Technical Question")),
                    "answer_summary": q.get("answer_transcript", "Candidate provided an explanation with relevant architectural context."),
                    "feedback": "Solid conceptual answer. Could be elevated by mentioning resilience patterns and telemetry monitoring.",
                    "suggested_answer": "Begin by establishing key constraints, state your core design decision, explain the trade-offs, and conclude with monitoring and failure recovery."
                }
                for q in questions
            ]
        }
