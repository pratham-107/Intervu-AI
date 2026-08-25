'use client';

import React, { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Mic,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  FileText,
  Clock,
  ArrowRight,
  Activity,
  Bot,
  Terminal,
  Cpu,
  Layers,
  Check,
  ChevronRight,
  Shield,
  Volume2
} from "lucide-react";

// Strongly-typed Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 24,
      stiffness: 180,
    },
  },
};

const cardHoverVariants: Variants = {
  initial: { y: 0, borderColor: "rgba(255, 255, 255, 0.08)" },
  hover: {
    y: -4,
    borderColor: "rgba(255, 255, 255, 0.24)",
    boxShadow: "0 12px 30px -10px rgba(255, 255, 255, 0.05)",
    transition: { duration: 0.2 },
  },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "eval" | "latency">("pipeline");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
      
      {/* Background developer grid & subtle atmospheric radial glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent blur-3xl pointer-events-none -z-10"
      />

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-6xl mx-auto px-4 pt-20 pb-20 sm:pt-28 sm:pb-28 text-center flex flex-col items-center"
      >
        
        {/* Release Pill Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[#e2e9f3] text-xs font-mono mb-8 backdrop-blur-md hover:border-white/20 transition-all cursor-default shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Real-time Voice AI & Speech Telemetry Pipeline</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] max-w-4xl"
        >
          Voice Mock Interviews with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e2e9f3] to-[#8b929e]">
            Real-Time AI Telemetry
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-base sm:text-lg text-[#8b929e] max-w-2xl leading-relaxed font-sans"
        >
          Practice speaking out loud against adaptive AI interviewers with Indian & global neural accents. Receive sub-second telemetry on conversational pacing, filler words, technical depth, and structured STAR delivery.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] text-black text-sm font-semibold shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-190"
          >
            <Mic className="w-4 h-4 fill-current" />
            Start Free Mock Interview
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-black hover:bg-white/[0.04] border border-white/[0.12] hover:border-white/[0.24] text-[#e2e9f3] hover:text-white text-sm font-medium transition-all duration-190"
          >
            View Pricing & Plans
          </Link>
        </motion.div>

        {/* Live Audio Telemetry Cockpit Mockup */}
        <motion.div
          variants={itemVariants}
          className="mt-16 w-full max-w-3xl rounded-3xl border border-white/[0.12] bg-[#090b0e]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-left relative overflow-hidden group"
        >
          
          {/* Header row with simulated active WebSocket */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <span className="text-xs font-mono text-[#8b929e]">live_session: ws_01jk98fe4</span>
            </div>
            
            {/* Animated Audio Equalizer Bars */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-3.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
                {[40, 90, 60, 100, 75, 45, 85].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      height: ["20%", `${h}%`, "30%"],
                    }}
                    transition={{
                      duration: 0.8 + i * 0.1,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                16kHz PCM Stream
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Question Prompt */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-[#8b929e] uppercase tracking-wider">AI Interviewer</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/[0.06] text-white">🇮🇳 Priya (Natural)</span>
                </div>
                <p className="text-sm text-white font-medium">
                  &ldquo;How do you architect an idempotent webhook receiver in high-throughput payment architectures?&rdquo;
                </p>
              </div>
            </motion.div>

            {/* Candidate Live Transcription */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">Live Candidate Speech</span>
                <p className="text-sm text-[#e2e9f3] leading-relaxed">
                  &ldquo;I record the incoming payment event ID with a unique constraint in Postgres, <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono text-xs">um</span>, verify the HMAC SHA-256 webhook signature before processing, and return an immediate 200 to prevent duplicate retries...&rdquo;
                </p>
              </div>
            </motion.div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3.5 rounded-2xl bg-black border border-white/[0.08]"
              >
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Speaking Pace</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-white font-mono">138</span>
                  <span className="text-[11px] text-emerald-400 font-mono">WPM (Ideal)</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3.5 rounded-2xl bg-black border border-white/[0.08]"
              >
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Filler Words</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-amber-400 font-mono">1</span>
                  <span className="text-[11px] text-[#8b929e] font-mono">detected</span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3.5 rounded-2xl bg-black border border-white/[0.08]"
              >
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Pipeline Latency</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-white font-mono">&lt; 0.6s</span>
                  <span className="text-[11px] text-indigo-400 font-mono">Real-Time</span>
                </div>
              </motion.div>
            </div>

          </div>

        </motion.div>

      </motion.section>

      {/* Interactive Architecture & Pipeline Tabs */}
      <section className="w-full max-w-6xl mx-auto px-4 py-20 border-t border-white/[0.08]">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono text-[#8b929e] uppercase tracking-wider block mb-2"
          >
            Full-Duplex Architecture
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
          >
            How the Real-Time Interview Loop Works
          </motion.h2>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-5 py-1.5 rounded-full text-xs font-mono transition-all duration-190 ${
                activeTab === "pipeline"
                  ? "bg-white text-black font-bold shadow"
                  : "text-[#8b929e] hover:text-white"
              }`}
            >
              1. 16kHz PCM Audio Stream
            </button>
            <button
              onClick={() => setActiveTab("eval")}
              className={`px-5 py-1.5 rounded-full text-xs font-mono transition-all duration-190 ${
                activeTab === "eval"
                  ? "bg-white text-black font-bold shadow"
                  : "text-[#8b929e] hover:text-white"
              }`}
            >
              2. Deepgram & Heuristic Telemetry
            </button>
            <button
              onClick={() => setActiveTab("latency")}
              className={`px-5 py-1.5 rounded-full text-xs font-mono transition-all duration-190 ${
                activeTab === "latency"
                  ? "bg-white text-black font-bold shadow"
                  : "text-[#8b929e] hover:text-white"
              }`}
            >
              3. STAR Evaluation Engine
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "pipeline" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Client-Side Audio Sampling</h3>
                <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
                  Web Audio API captures the microphone input, converts Float32 data into 16-bit linear PCM binary chunks (~250ms), and streams them over a persistent WebSocket connection directly to the server.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Sub-20ms microphone latency</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black border border-white/[0.08] font-mono text-[11px] text-[#8b929e] space-y-2">
                <p className="text-white font-bold">// WebSocket Stream Frame</p>
                <p className="text-emerald-400">&gt; Int16Array (4096 samples @ 16kHz)</p>
                <p className="text-[#575e6b]">&gt; ws.send(pcm16.buffer)</p>
                <p className="text-indigo-400">&lt; event: transcript_partial</p>
              </div>
            </motion.div>
          )}

          {activeTab === "eval" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Speech Analytics & Telemetry</h3>
                <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
                  Deepgram Nova-2 transcribes speech concurrently while a rolling regex engine tracks verbal filler words (&ldquo;like&rdquo;, &ldquo;um&rdquo;, &ldquo;basically&rdquo;) and computes conversational cadence in Words-Per-Minute.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
                  <Check className="w-4 h-4" />
                  <span>Real-time HUD signals</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black border border-white/[0.08] font-mono text-[11px] text-[#8b929e] space-y-2">
                <p className="text-white font-bold">// Heuristic Signal Data</p>
                <p className="text-amber-400">&quot;filler_count&quot;: 2,</p>
                <p className="text-emerald-400">&quot;pace_wpm&quot;: 142,</p>
                <p className="text-white">&quot;assessment&quot;: &quot;Optimal Pace&quot;</p>
              </div>
            </motion.div>
          )}

          {activeTab === "latency" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">STAR Evaluation & Model Answers</h3>
                <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
                  Post-session, Groq Llama-3.3 / Gemini analyzes candidate responses against structured STAR rubrics (Situation, Task, Action, Result), providing quantified scores (0-100) and model solutions.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <Check className="w-4 h-4" />
                  <span>Actionable hiring feedback</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-black border border-white/[0.08] font-mono text-[11px] text-[#8b929e] space-y-2">
                <p className="text-white font-bold">// Evaluation JSON Output</p>
                <p className="text-emerald-400">&quot;overall_score&quot;: 88,</p>
                <p className="text-indigo-400">&quot;strengths&quot;: [&quot;Clear trade-offs&quot;],</p>
                <p className="text-amber-400">&quot;suggested_answer&quot;: &quot;STAR exemplar...&quot;</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Core Capabilities Cards */}
      <section id="features" className="w-full max-w-6xl mx-auto px-4 py-20 border-t border-white/[0.08]">
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-[#8b929e] uppercase tracking-wider block mb-2">Engineered for Technical Mastery</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Purpose-Built for High-Stakes Tech Interviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <motion.div
            variants={cardHoverVariants}
            initial="initial"
            whileHover="hover"
            className="p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Sub-Second Voice Pipeline</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Client-side 16kHz PCM downsampling over WebSockets with Deepgram speech-to-text for authentic spoken conversations.
            </p>
          </motion.div>

          <motion.div
            variants={cardHoverVariants}
            initial="initial"
            whileHover="hover"
            className="p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-5">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Indian & Global Accents</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Choose from natural Indian English accents (Priya / Ravi) or studio Deepgram Aura voices for comfortable mock sessions.
            </p>
          </motion.div>

          <motion.div
            variants={cardHoverVariants}
            initial="initial"
            whileHover="hover"
            className="p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-5">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Structured STAR Reports</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Post-interview evaluations with readiness ratings (0-100), key strengths, growth gaps, and model exemplary answers.
            </p>
          </motion.div>

        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="w-full border-t border-white/[0.08] py-20 text-center bg-gradient-to-b from-black to-[#090b0e]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 flex flex-col items-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to excel in your next interview?</h2>
          <p className="text-[#8b929e] text-sm sm:text-base mt-3 max-w-xl">
            Start immediately with 2 free full-length voice mock sessions. No credit card required.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] text-black text-sm font-semibold shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-190"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
