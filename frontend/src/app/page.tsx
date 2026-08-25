import Link from "next/link";
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
  AudioWaveform,
  Activity,
  Bot,
  Terminal,
  Cpu,
  Layers,
  Check
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative">
      
      {/* Background developer grid & subtle atmospheric glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-white/[0.07] via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center flex flex-col items-center">
        
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[#e2e9f3] text-xs font-mono mb-8 backdrop-blur-md hover:border-white/20 transition-all">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Voice AI & Speech Analytics Pipeline</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] max-w-4xl">
          Voice Mock Interviews with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e2e9f3] to-[#8b929e]">
            Real-Time AI Telemetry
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#8b929e] max-w-2xl leading-relaxed">
          Practice speaking out loud against adaptive technical interviewers. Receive sub-second feedback on speech pacing, filler words, technical depth, and structured STAR delivery.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] text-black text-sm font-semibold shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-190"
          >
            <Mic className="w-4 h-4 fill-current" />
            Start Free Mock Interview
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-black hover:bg-white/[0.04] border border-white/[0.12] hover:border-white/[0.24] text-[#e2e9f3] hover:text-white text-sm font-medium transition-all duration-190"
          >
            View Pricing & Plans
          </Link>
        </div>

        {/* Live Audio Telemetry Cockpit Preview */}
        <div className="mt-16 w-full max-w-3xl rounded-2xl border border-white/[0.1] bg-[#090b0e]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-left relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <span className="text-xs font-mono text-[#8b929e]">session_id: ws_01jk98fe4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                16kHz PCM Stream
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Question Prompt */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#8b929e] uppercase tracking-wider block mb-1">AI Interviewer</span>
                <p className="text-sm text-white font-medium">
                  &ldquo;How do you architect an idempotent webhook receiver in high-throughput payment architectures?&rdquo;
                </p>
              </div>
            </div>

            {/* Candidate Live Transcription */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">Live Candidate Speech</span>
                <p className="text-sm text-[#e2e9f3] leading-relaxed">
                  &ldquo;I record the incoming payment event ID with a unique constraint in Postgres, <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono text-xs">um</span>, verify the HMAC SHA-256 webhook signature before processing, and return an immediate 200 to prevent retries...&rdquo;
                </p>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-black border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Speaking Pace</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-white font-mono">138</span>
                  <span className="text-[11px] text-emerald-400 font-mono">WPM (Ideal)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Filler Words</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-amber-400 font-mono">1</span>
                  <span className="text-[11px] text-[#8b929e] font-mono">detected</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#8b929e] uppercase tracking-wider block">Latency</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-white font-mono">&lt; 0.8s</span>
                  <span className="text-[11px] text-indigo-400 font-mono">Real-Time</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Core Capabilities */}
      <section id="features" className="w-full max-w-6xl mx-auto px-4 py-24 border-t border-white/[0.08]">
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-[#8b929e] uppercase tracking-wider block mb-2">Engineered for Technical Mastery</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Purpose-Built for High-Stakes Tech Interviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 sm:p-8 rounded-2xl bg-[#090b0e] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white mb-5">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Sub-Second Voice Pipeline</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Client-side 16kHz PCM downsampling over persistent WebSockets with Deepgram speech-to-text for natural spoken conversation.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#090b0e] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white mb-5">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Live Delivery Analytics</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Real-time heuristic tracking of filler words (&ldquo;um&rdquo;, &ldquo;like&rdquo;, &ldquo;you know&rdquo;), conversational WPM pace, and pause hesitation.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#090b0e] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white mb-5">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Structured STAR Reports</h3>
            <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">
              Exhaustive post-interview evaluation with readiness ratings (0-100), key strengths, growth gaps, and model exemplary answers.
            </p>
          </div>

        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="w-full border-t border-white/[0.08] py-20 text-center bg-gradient-to-b from-black to-[#090b0e]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
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
        </div>
      </section>

    </div>
  );
}
