'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Mic,
  Sparkles,
  Volume2,
  AlertCircle,
  ArrowRight,
  Shield,
  Loader2,
  Check,
  UserCheck
} from 'lucide-react';

const POPULAR_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'Product Manager',
  'DevOps & Cloud Engineer',
  'System Design Architect',
  'Data Scientist & ML'
];

const VOICE_OPTIONS = [
  { id: 'aura-arcas-en', name: '🎙️ Deepgram Arcas (Authoritative Neural Voice)', desc: 'Deep, crisp, professional studio voice with natural cadence' },
  { id: 'aura-asteria-en', name: '🎙️ Deepgram Asteria (Conversational Neural Voice)', desc: 'Warm, clear, and engaging studio voice' },
  { id: 'indian-female', name: '🇮🇳 Indian Accent (Female — Priya / Neerja)', desc: 'Natural Indian English accent with clear articulation' },
  { id: 'indian-male', name: '🇮🇳 Indian Accent (Male — Ravi / Prabhat)', desc: 'Natural Indian English accent with professional tone' }
];

function NewInterviewContent() {
  const router = useRouter();
  const { user, subscription, usage } = useAuth();

  const [role, setRole] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedVoice, setSelectedVoice] = useState('aura-arcas-en');
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const playVoicePreview = async (voiceId: string) => {
    setIsPlayingPreview(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const sampleText = "Hello! I am your AI technical interviewer. Let us begin your mock session.";

    if (voiceId.startsWith('indian-')) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const indianVoices = voices.filter(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
        
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;

        if (voiceId === 'indian-female') {
          const female = indianVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('zira')) || indianVoices[0];
          if (female) utterance.voice = female;
        } else {
          const male = indianVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('prabhat') || v.name.toLowerCase().includes('david')) || indianVoices[0];
          if (male) utterance.voice = male;
        }

        utterance.onend = () => setIsPlayingPreview(false);
        utterance.onerror = () => setIsPlayingPreview(false);
        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // Deepgram Aura preview
    try {
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const res = await fetch(`${aiServiceUrl}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice: voiceId })
      });
      if (res.ok) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setIsPlayingPreview(false);
        audio.onerror = () => setIsPlayingPreview(false);
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Preview fallback:', e);
    }
    setIsPlayingPreview(false);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      setMicActive(true);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.8)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      alert('Microphone access was denied or not found. Please check permissions.');
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setMicActive(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    // Populate browser speech synthesis voices if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      stopMicTest();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartInterview = async () => {
    setError(null);
    setLoading(true);

    try {
      const checkRes = await api.get('/api/sessions/can-start');
      if (!checkRes.data?.allowed) {
        router.push('/pricing');
        return;
      }

      const sessionRes = await api.post('/api/sessions', {
        role,
        difficulty
      });

      const { session_id } = sessionRes.data;

      if (resumeText.trim()) {
        await api.patch('/api/auth/profile', { resume_text: resumeText });
      }

      router.push(`/interview/${session_id}?role=${encodeURIComponent(role)}&difficulty=${difficulty}&voice=${selectedVoice}`);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You have reached your 2 free interviews limit for this month.");
      } else {
        setError(err.response?.data?.error || 'Failed to initialize interview session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscription?.plan === 'pro';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-black text-white">
      
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <span className="text-[11px] font-mono text-[#8b929e] uppercase tracking-wider block mb-1">Configuration</span>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Session Setup & Calibration
        </h1>
        <p className="text-xs sm:text-sm text-[#8b929e] mt-1">
          Select target technical discipline, difficulty level, and AI interviewer accent.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded-full text-xs font-semibold"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Role Selection */}
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider mb-3">
              1. Select Job Role / Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POPULAR_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-medium transition-all duration-190 ${
                    role === r
                      ? 'border-white bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                      : 'border-white/[0.08] bg-black text-[#8b929e] hover:border-white/[0.18] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* AI Interviewer Voice Accent Selection */}
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider">
                2. AI Interviewer Voice & Accent
              </label>
              <button
                type="button"
                onClick={() => playVoicePreview(selectedVoice)}
                disabled={isPlayingPreview}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-white transition-all"
              >
                <Volume2 className="w-3 h-3 text-emerald-400" />
                {isPlayingPreview ? 'Playing Sample...' : 'Preview Voice'}
              </button>
            </div>

            <div className="space-y-2.5">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-190 ${
                    selectedVoice === v.id
                      ? 'border-white bg-white/10 text-white shadow'
                      : 'border-white/[0.08] bg-black text-[#8b929e] hover:border-white/[0.18] hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{v.name}</div>
                    <div className="text-[11px] text-[#8b929e] mt-0.5">{v.desc}</div>
                  </div>
                  {selectedVoice === v.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider mb-3">
              3. Select Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-3 px-4 rounded-full border text-center text-xs font-mono capitalize transition-all duration-190 ${
                    difficulty === lvl
                      ? 'border-white bg-white text-black font-bold shadow'
                      : 'border-white/[0.08] bg-black text-[#8b929e] hover:border-white/[0.18] hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Resume Tailoring Context */}
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase text-[#8b929e] tracking-wider">
                4. Resume / Project Context
              </label>
              {!isPro && (
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-[#575e6b] mb-3">
              Provide your architecture or project summaries to generate hyper-specific questions.
            </p>
            <textarea
              rows={3}
              disabled={!isPro}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={isPro ? "e.g. Architected distributed payment microservices processing 50k req/sec with Redis caching..." : "Upgrade to Pro to enable custom resume prompts"}
              className="w-full bg-black border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-[#575e6b] focus:outline-none focus:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

        </div>

        {/* Right Col: Audio Mic Test & Start CTA */}
        <div className="space-y-6">
          
          {/* Mic Calibration Card */}
          <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              Microphone Calibration
            </h3>
            <p className="text-[11px] text-[#8b929e] mb-4">
              Test your audio input before launching session.
            </p>

            {/* Level Visualizer Bar */}
            <div className="w-full bg-black rounded-full h-2.5 mb-4 overflow-hidden border border-white/[0.08] p-0.5">
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>

            <button
              type="button"
              onClick={micActive ? stopMicTest : startMicTest}
              className={`w-full py-2.5 rounded-full border text-xs font-mono transition-all duration-190 ${
                micActive
                  ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-[#e2e9f3]'
              }`}
            >
              {micActive ? 'Stop Mic Test' : 'Test Microphone'}
            </button>
          </div>

          {/* Usage Badge */}
          <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08] text-xs text-[#8b929e]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px]">Monthly Sessions</span>
              <span className="font-mono text-white font-semibold">
                {isPro ? 'Unlimited (Pro)' : `${usage?.sessionsThisMonth || 0} / 2 Used`}
              </span>
            </div>
            {!isPro && (
              <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                <div
                  className="bg-white h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, ((usage?.sessionsThisMonth || 0) / 2) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Start CTA */}
          <button
            type="button"
            onClick={handleStartInterview}
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] disabled:opacity-50 text-black font-semibold text-xs shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-190 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Launch Interview Room
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}

export default function NewInterviewPage() {
  return (
    <ProtectedRoute>
      <NewInterviewContent />
    </ProtectedRoute>
  );
}
