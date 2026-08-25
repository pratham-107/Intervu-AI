import os
import time
import json
import asyncio
import httpx
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .analytics import SpeechAnalytics
from .llm import LLMEngine
from .deepgram_service import DeepgramLiveSession

load_dotenv()

app = FastAPI(
    title="IntervuAI AI & Real-Time Audio Service",
    version="1.0.0",
    description="Real-time WebSocket audio processing, Deepgram live STT, Aura TTS, and LLM feedback engine."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_engine = LLMEngine()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# In-memory active session states
active_sessions: Dict[str, Dict[str, Any]] = {}

class QuestionGenRequest(BaseModel):
    role: str
    difficulty: str = "medium"
    resume_text: Optional[str] = None

class FeedbackGenRequest(BaseModel):
    session_id: str
    role: str
    difficulty: str = "medium"
    questions: List[Dict[str, Any]]

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "aura-asteria-en" # e.g. aura-asteria-en, aura-arcas-en, aura-luna-en

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "intervuai-ai-service",
        "timestamp": time.time(),
        "active_sessions": len(active_sessions)
    }

@app.get("/")
async def root():
    return {
        "message": "IntervuAI AI Real-Time Service is active.",
        "docs": "/docs"
    }

@app.post("/api/questions/generate")
async def generate_questions_endpoint(req: QuestionGenRequest):
    questions = await llm_engine.generate_questions(
        role=req.role,
        difficulty=req.difficulty,
        resume_text=req.resume_text
    )
    return {"questions": questions}

@app.post("/api/feedback/generate")
async def generate_feedback_endpoint(req: FeedbackGenRequest):
    report = await llm_engine.generate_feedback(
        role=req.role,
        difficulty=req.difficulty,
        questions=req.questions
    )
    return report

@app.post("/api/tts/speak")
async def text_to_speech_endpoint(req: TTSRequest):
    if not DEEPGRAM_API_KEY:
        raise HTTPException(status_code=500, detail="Deepgram API key not configured")
    
    url = f"https://api.deepgram.com/v1/speak?model={req.voice or 'aura-asteria-en'}"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, json={"text": req.text}, timeout=10.0)
            if res.status_code == 200:
                return Response(content=res.content, media_type="audio/mpeg")
            else:
                raise HTTPException(status_code=res.status_code, detail="Deepgram TTS failed")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS Generation Error: {str(e)}")

@app.websocket("/ws/interview/{session_id}")
async def websocket_interview_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = Query(None)
):
    await websocket.accept()
    
    # Initialize per-session state
    session_state = {
        "session_id": session_id,
        "start_time": time.time(),
        "current_question_index": 0,
        "transcript_chunks": [],
        "filler_words_total": 0,
        "filler_counts": {},
        "total_words": 0,
        "last_speech_time": time.time()
    }
    active_sessions[session_id] = session_state

    # Callback when Deepgram produces transcript results
    async def on_deepgram_transcript(text: str, is_final: bool):
        if not text:
            return
        
        session_state["last_speech_time"] = time.time()
        
        if is_final:
            session_state["transcript_chunks"].append(text)
            filler_count, filler_dict = SpeechAnalytics.count_filler_words(text)
            session_state["filler_words_total"] += filler_count
            for k, v in filler_dict.items():
                session_state["filler_counts"][k] = session_state["filler_counts"].get(k, 0) + v
            
            words_in_chunk = len(text.split())
            session_state["total_words"] += words_in_chunk
        
        elapsed_seconds = max(1.0, time.time() - session_state["start_time"])
        wpm = SpeechAnalytics.calculate_wpm(session_state["total_words"], elapsed_seconds)
        pace_assessment = SpeechAnalytics.get_pace_assessment(wpm)

        try:
            await websocket.send_json({
                "event": "transcript_final" if is_final else "transcript_partial",
                "text": text,
                "data": {
                    "filler_count": session_state["filler_words_total"],
                    "recent_fillers": session_state["filler_counts"],
                    "pace_wpm": wpm,
                    "pace_assessment": pace_assessment,
                    "total_words": session_state["total_words"]
                }
            })
        except Exception:
            pass

    # Initialize live Deepgram session
    deepgram_session = DeepgramLiveSession(on_deepgram_transcript)
    deepgram_connected = await deepgram_session.start()

    # Send initial connection confirmation
    try:
        await websocket.send_json({
            "event": "connected",
            "session_id": session_id,
            "deepgram_stt_active": deepgram_connected,
            "message": "Real-time speech analysis & STT pipeline connected."
        })
    except Exception:
        pass

    try:
        while True:
            message = await websocket.receive()
            
            if message.get("type") == "websocket.disconnect":
                break

            # Binary frame (16kHz PCM audio chunk from client microphone)
            if "bytes" in message and message["bytes"]:
                pcm_data = message["bytes"]
                if deepgram_connected:
                    await deepgram_session.send_audio(pcm_data)

            # JSON text frame
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    event_type = payload.get("event")

                    if event_type == "transcript_chunk":
                        chunk_text = payload.get("text", "").strip()
                        is_final = payload.get("is_final", False)
                        if chunk_text:
                            await on_deepgram_transcript(chunk_text, is_final)

                    elif event_type == "next_question":
                        session_state["current_question_index"] = payload.get("index", 0)
                        await websocket.send_json({
                            "event": "question_switched",
                            "index": session_state["current_question_index"]
                        })

                    elif event_type == "end_session":
                        elapsed_seconds = max(1.0, time.time() - session_state["start_time"])
                        avg_wpm = SpeechAnalytics.calculate_wpm(session_state["total_words"], elapsed_seconds)

                        await websocket.send_json({
                            "event": "session_completed",
                            "session_id": session_id,
                            "summary": {
                                "total_duration_seconds": int(elapsed_seconds),
                                "total_words": session_state["total_words"],
                                "filler_word_count": session_state["filler_words_total"],
                                "filler_breakdown": session_state["filler_counts"],
                                "avg_pace_wpm": avg_wpm
                            }
                        })

                except json.JSONDecodeError:
                    pass

    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        await deepgram_session.stop()
        if session_id in active_sessions:
            del active_sessions[session_id]
