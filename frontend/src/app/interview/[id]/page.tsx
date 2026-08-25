'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Square,
  Activity,
  ShieldAlert,
  Loader2,
  Bot
} from 'lucide-react';

interface Question {
  id: string;
  order: number;
  text: string;
}

function LiveInterviewRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const sessionId = params.id as string;
  const role = searchParams.get('role') || 'Frontend Developer';
  const difficulty = searchParams.get('difficulty') || 'medium';
  const voicePreference = searchParams.get('voice') || 'indian-female';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Audio / STT states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimChunk, setInterimChunk] = useState('');

  // Live Coaching Signals
  const [fillerCount, setFillerCount] = useState(0);
  const [recentFillers, setRecentFillers] = useState<Record<string, number>>({});
  const [paceWpm, setPaceWpm] = useState(0);
  const [paceAssessment, setPaceAssessment] = useState('Listening...');
  const [isFinishing, setIsFinishing] = useState(false);
  const [serverSttActive, setServerSttActive] = useState(false);

  // Audio pipeline refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Questions & Connect WebSocket
  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      try {
        const qRes = await api.post('/api/questions/generate', {
          role,
          difficulty
        });

        if (isMounted) {
          setQuestions(qRes.data.questions || []);
          setLoadingQuestions(false);
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
        if (isMounted) setLoadingQuestions(false);
      }
    }

    loadQuestions();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    try {
      const ws = new WebSocket(`${wsUrl}/ws/interview/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to AI service STT pipeline');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.event === 'connected') {
            if (msg.deepgram_stt_active) {
              setServerSttActive(true);
            }
          } else if (msg.event === 'transcript_final') {
            const finalTxt = msg.text;
            setLiveTranscript((prev) => {
              const updated = (prev + ' ' + finalTxt).trim();
              setAnswers((prevAns) => ({ ...prevAns, [currentIndex]: updated }));
              return updated;
            });
            setInterimChunk('');
            if (msg.data) {
              setFillerCount(msg.data.filler_count || 0);
              setRecentFillers(msg.data.recent_fillers || {});
              setPaceWpm(msg.data.pace_wpm || 0);
              setPaceAssessment(msg.data.pace_assessment || '');
            }
          } else if (msg.event === 'transcript_partial') {
            setInterimChunk(msg.text || '');
            if (msg.data) {
              setFillerCount(msg.data.filler_count || 0);
              setRecentFillers(msg.data.recent_fillers || {});
              setPaceWpm(msg.data.pace_wpm || 0);
              setPaceAssessment(msg.data.pace_assessment || '');
            }
          } else if (msg.event === 'live_signal') {
            setFillerCount(msg.data?.filler_count || 0);
            setRecentFillers(msg.data?.recent_fillers || {});
            setPaceWpm(msg.data?.pace_wpm || 0);
            setPaceAssessment(msg.data?.pace_assessment || '');
          }
        } catch (e) {
          console.error('WS Parse Error:', e);
        }
      };
    } catch (wsErr) {
      console.warn('[WebSocket] Direct socket connection failed:', wsErr);
    }

    return () => {
      isMounted = false;
      stopAudioCapture();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (wsRef.current) wsRef.current.close();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sessionId, role, difficulty]);

  // 2. Speech Synthesis with Indian Accent & Deepgram Support
  const speakCurrentQuestion = async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingAI(true);

    // If Indian accent chosen: prioritize browser Indian English Neural voice (Neerja / Ravi / Heera / en-IN)
    if (voicePreference.startsWith('indian-')) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const indianVoices = voices.filter(v => 
          v.lang === 'en-IN' || 
          v.lang === 'hi-IN' || 
          v.name.toLowerCase().includes('india') || 
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('heera') ||
          v.name.toLowerCase().includes('ravi') ||
          v.name.toLowerCase().includes('prabhat')
        );

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 0.96; // comfortable conversational cadence
        utterance.pitch = 1.0;

        if (voicePreference === 'indian-female') {
          const femaleVoice = indianVoices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('neerja') || 
            v.name.toLowerCase().includes('heera') ||
            v.name.toLowerCase().includes('zira')
          ) || indianVoices[0];
          if (femaleVoice) utterance.voice = femaleVoice;
        } else {
          const maleVoice = indianVoices.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('ravi') || 
            v.name.toLowerCase().includes('prabhat') ||
            v.name.toLowerCase().includes('david')
          ) || indianVoices[0];
          if (maleVoice) utterance.voice = maleVoice;
        }

        utterance.onend = () => {
          setIsSpeakingAI(false);
          startAudioCapture();
        };
        utterance.onerror = () => {
          setIsSpeakingAI(false);
          startAudioCapture();
        };

        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // Global / Deepgram Aura neural model
    try {
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const response = await fetch(`${aiServiceUrl}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voicePreference })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsSpeakingAI(false);
          startAudioCapture();
        };
        audio.onerror = () => {
          setIsSpeakingAI(false);
          startAudioCapture();
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('[TTS] Neural voice stream unavailable, using browser synthesis:', e);
    }

    // Generic fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsSpeakingAI(false);
        startAudioCapture();
      };
      utterance.onerror = () => setIsSpeakingAI(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeakingAI(false);
      startAudioCapture();
    }
  };

  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      speakCurrentQuestion(questions[currentIndex].text);
      setLiveTranscript(answers[currentIndex] || '');
      setInterimChunk('');
    }
  }, [currentIndex, questions]);

  // 3. Real 16kHz PCM Audio Streaming Pipeline
  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        wsRef.current.send(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsRecording(true);

      if (!serverSttActive && typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Set to Indian English STT

          recognition.onresult = (evt: any) => {
            let finalized = '';
            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
              if (evt.results[i].isFinal) {
                finalized += evt.results[i][0].transcript + ' ';
              }
            }
            if (finalized && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                event: 'transcript_chunk',
                text: finalized,
                is_final: true
              }));
            }
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {}
        }
      }

    } catch (err) {
      console.error('Audio capture error:', err);
    }
  };

  const stopAudioCapture = () => {
    setIsRecording(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const handleNextQuestion = () => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: liveTranscript }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: liveTranscript }));
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishInterview = async () => {
    setIsFinishing(true);
    stopAudioCapture();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const finalizedQuestions = questions.map((q, idx) => ({
      question_id: q.id,
      question_text: q.text,
      answer_transcript: answers[idx] || (idx === currentIndex ? liveTranscript : '')
    }));

    try {
      await api.patch(`/api/sessions/${sessionId}/end`, {
        questions: finalizedQuestions
      });

      router.push(`/report/${sessionId}`);
    } catch (err) {
      console.error('Error finalizing interview:', err);
      router.push(`/report/${sessionId}`);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-white animate-spin mb-3" />
        <h2 className="text-base font-bold text-white tracking-tight">Initializing Session Telemetry...</h2>
        <p className="text-xs text-[#8b929e] font-mono mt-1">Generating custom prompt bank for {role}</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)] bg-black text-white">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Voice Session {voicePreference.startsWith('indian') ? '• 🇮🇳 Indian Accent' : '• Deepgram Nova-2'}
            </span>
          </div>
          <h1 className="text-base font-bold text-white mt-1">
            {role} <span className="text-[#8b929e] font-mono text-xs">({difficulty})</span>
          </h1>
        </div>

        {/* Question Progress Dots */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [currentIndex]: liveTranscript }));
                setCurrentIndex(idx);
              }}
              className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition-all flex items-center justify-center ${
                currentIndex === idx
                  ? 'bg-white text-black shadow'
                  : answers[idx]
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-[#8b929e] hover:text-white'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Finish Session CTA */}
        <button
          onClick={handleFinishInterview}
          disabled={isFinishing}
          className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-mono font-semibold flex items-center gap-2 transition-all"
        >
          {isFinishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Square className="w-3 h-3 fill-current" />
              End Session & Generate Report
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Left Question/Mic, Right Live Coaching Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
        
        {/* Left 2 Cols: Question & Speech Controls */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* AI Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#8b929e] uppercase tracking-wider">
                  Question {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <button
                onClick={() => currentQ && speakCurrentQuestion(currentQ.text)}
                className={`px-3 py-1 rounded-full border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  isSpeakingAI
                    ? 'border-white bg-white text-black font-semibold animate-pulse'
                    : 'border-white/[0.1] bg-black text-[#8b929e] hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                {isSpeakingAI ? 'Speaking...' : 'Replay Question'}
              </button>
            </div>

            <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
              &ldquo;{currentQ?.text}&rdquo;
            </p>
          </div>

          {/* Live Transcript & Mic Capture Area */}
          <div className="flex-1 p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] flex flex-col justify-between relative min-h-[260px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b929e] flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  PCM Stream & Transcription
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Streaming 16kHz PCM Audio
                  </span>
                )}
              </div>

              {/* Spoken Text Display */}
              <div className="text-xs sm:text-sm text-[#e2e9f3] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
                {liveTranscript ? (
                  <>
                    <span>{liveTranscript}</span>
                    {interimChunk && <span className="text-[#8b929e] italic font-mono text-xs"> {interimChunk}</span>}
                  </>
                ) : (
                  <span className="text-[#575e6b] font-mono text-xs">
                    Press &quot;Turn On Mic&quot; and begin speaking your technical explanation out loud...
                  </span>
                )}
              </div>
            </div>

            {/* Mic Controls Bar */}
            <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={isRecording ? stopAudioCapture : startAudioCapture}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg transition-all duration-190 ${
                  isRecording
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 animate-pulse'
                    : 'bg-white text-black hover:bg-[#e2e9f3] active:scale-[0.98]'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    Pause Mic
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 fill-current" />
                    Turn On Mic
                  </>
                )}
              </button>

              {/* Question Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="p-2.5 rounded-full border border-white/[0.08] bg-black text-[#8b929e] hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentIndex === questions.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] disabled:opacity-30 text-white text-xs font-semibold transition-all duration-190"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Col: Live Real-Time Telemetry */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Live Telemetry & Signals
            </h3>

            {/* Speaking Pace (WPM) */}
            <div className="mb-4 p-4 rounded-2xl bg-black border border-white/[0.08]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-[#8b929e] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Speaking Pace
                </span>
                <span className="text-sm font-bold text-white font-mono">{paceWpm} WPM</span>
              </div>
              <p className="text-[11px] text-[#8b929e] mt-1 font-mono">{paceAssessment}</p>
            </div>

            {/* Filler Words Counter */}
            <div className="mb-4 p-4 rounded-2xl bg-black border border-white/[0.08]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-[#8b929e] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Filler Words
                </span>
                <span className="text-sm font-bold text-amber-400 font-mono">{fillerCount}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(recentFillers).length > 0 ? (
                  Object.entries(recentFillers).map(([word, cnt]) => (
                    <span key={word} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                      &ldquo;{word}&rdquo; × {cnt}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#575e6b] font-mono">No verbal fillers detected.</span>
                )}
              </div>
            </div>

            {/* STAR Assistant Tips */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-[#8b929e] space-y-2">
              <span className="font-mono text-[11px] text-white block uppercase">STAR Framework:</span>
              <ul className="space-y-1.5 text-[11px] font-mono">
                <li><strong className="text-white">S:</strong> Context & constraints</li>
                <li><strong className="text-white">T:</strong> Problem ownership</li>
                <li><strong className="text-white">A:</strong> Technical decisions</li>
                <li><strong className="text-white">R:</strong> Metrics & latency impact</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function LiveInterviewRoomPage() {
  return (
    <ProtectedRoute>
      <LiveInterviewRoomContent />
    </ProtectedRoute>
  );
}
