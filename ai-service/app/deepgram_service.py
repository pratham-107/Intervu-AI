import os
import json
import asyncio
import websockets
from typing import Callable, Optional
from dotenv import load_dotenv

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

class DeepgramLiveSession:
    def __init__(self, on_transcript_callback: Callable[[str, bool], asyncio.Future]):
        self.api_key = os.getenv("DEEPGRAM_API_KEY") or DEEPGRAM_API_KEY
        self.on_transcript = on_transcript_callback
        self.ws = None
        self.is_running = False
        self.receive_task = None

    async def start(self) -> bool:
        if not self.api_key:
            print("[Deepgram] No API key configured; server-side STT disabled.")
            return False

        url = "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=true&model=nova-2"
        headers = {"Authorization": f"Token {self.api_key}"}

        try:
            # websockets v14+ uses additional_headers
            try:
                self.ws = await websockets.connect(url, additional_headers=headers)
            except TypeError:
                self.ws = await websockets.connect(url, extra_headers=headers)

            self.is_running = True
            self.receive_task = asyncio.create_task(self._listen_loop())
            print("[Deepgram] Connected to live Nova-2 streaming STT successfully!")
            return True
        except Exception as e:
            print(f"[Deepgram] Connection error: {e}")
            self.is_running = False
            return False

    async def _listen_loop(self):
        try:
            while self.is_running and self.ws:
                message = await self.ws.recv()
                data = json.loads(message)

                if data.get("type") == "Results":
                    channel = data.get("channel", {})
                    alternatives = channel.get("alternatives", [])
                    if alternatives:
                        transcript = alternatives[0].get("transcript", "").strip()
                        is_final = data.get("is_final", False)
                        if transcript:
                            await self.on_transcript(transcript, is_final)

        except websockets.exceptions.ConnectionClosed:
            pass
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"[Deepgram] Listen loop error: {e}")
        finally:
            self.is_running = False

    async def send_audio(self, pcm_bytes: bytes):
        if self.is_running and self.ws:
            try:
                await self.ws.send(pcm_bytes)
            except Exception as e:
                pass

    async def stop(self):
        self.is_running = False
        if self.receive_task:
            self.receive_task.cancel()
            try:
                await self.receive_task
            except asyncio.CancelledError:
                pass
            self.receive_task = None
        if self.ws:
            try:
                await self.ws.send(json.dumps({"type": "CloseStream"}))
                await self.ws.close()
            except Exception:
                pass
            self.ws = None
