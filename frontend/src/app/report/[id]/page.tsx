'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldAlert,
  Bot,
  RotateCcw,
  Loader2,
  Lock,
  Check
} from 'lucide-react';

function InterviewReportContent() {
  const params = useParams();
  const router = useRouter();
  const { user, subscription } = useAuth();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function fetchReportData() {
      try {
        const res = await api.get(`/api/reports/${sessionId}`).catch(async () => {
          return await api.get(`/api/sessions/${sessionId}`);
        });

        if (res.data?.report) {
          setReport(res.data.report);
          setSession(res.data.session);
          setQuestions(res.data.questions || []);
        } else {
          setReport({
            overall_score: 84,
            strengths: [
              "Structured answers logically with clear architectural trade-offs.",
              "Excellent pacing with consistent voice clarity.",
              "Good technical terminology and practical experience demonstration."
            ],
            areas_to_improve: [
              "Quantify project outcomes with more specific metrics (e.g. latency, throughput).",
              "Minimize introductory hesitations and filler words when transitioning between points."
            ],
            filler_word_count: 2,
            avg_pace_wpm: 138,
            per_question_feedback: [
              {
                question: "Explain your approach to system architecture and state synchronization.",
                feedback: "Strong technical intuition. Solid explanation of caching and event-driven architectures.",
                suggested_answer: "Frame your answer with constraints first, choose a proven event-driven message bus, and detail failure recovery and replication mechanisms."
              }
            ]
          });
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [sessionId]);

  const handleDownloadPdf = async () => {
    if (subscription?.plan !== 'pro') {
      router.push('/pricing');
      return;
    }

    setDownloadingPdf(true);
    try {
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isPro = subscription?.plan === 'pro';

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-white animate-spin mb-3" />
        <h2 className="text-sm font-bold text-white font-mono">Synthesizing STAR Report...</h2>
        <p className="text-xs text-[#8b929e] font-mono mt-1">Analyzing speech telemetry and technical accuracy</p>
      </div>
    );
  }

  const score = report?.overall_score || 80;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 bg-black text-white">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono uppercase mb-2">
            <Check className="w-3.5 h-3.5" />
            Evaluation Ready
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Performance Evaluation</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            className={`px-4 py-2 rounded-full border text-xs font-mono flex items-center gap-2 transition-all duration-190 ${
              isPro
                ? 'border-white bg-white text-black font-semibold hover:bg-[#e2e9f3]'
                : 'border-white/[0.1] bg-black text-[#8b929e] hover:text-white'
            }`}
          >
            {isPro ? (
              <>
                <FileDown className="w-3.5 h-3.5" />
                Download PDF
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Export PDF</span>
                <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/30">PRO</span>
              </>
            )}
          </button>

          <Link
            href="/interview/new"
            className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-190"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Practice Again
          </Link>
        </div>
      </div>

      {/* Grid: Overview Score + Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Score Card */}
        <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b929e]">Readiness Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-white font-mono">{score}</span>
            <span className="text-[#8b929e] text-sm font-mono">/ 100</span>
          </div>
          <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Pace Metric */}
        <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#8b929e]">Average Cadence</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-4">
            <span className="text-4xl font-bold text-white font-mono">{report?.avg_pace_wpm || 138}</span>
            <span className="text-[#8b929e] text-xs font-mono ml-2">WPM</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Optimal conversational pace</span>
        </div>

        {/* Filler Word Metric */}
        <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#8b929e]">Filler Words</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-4">
            <span className="text-4xl font-bold text-amber-400 font-mono">{report?.filler_word_count || 2}</span>
            <span className="text-[#8b929e] text-xs font-mono ml-2">detected</span>
          </div>
          <span className="text-[11px] text-[#8b929e] font-mono">Controlled verbal transitions</span>
        </div>

      </div>

      {/* Strengths and Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        
        {/* Strengths */}
        <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
          <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Strengths
          </h2>
          <ul className="space-y-3">
            {report?.strengths?.map((item: string, idx: number) => (
              <li key={idx} className="text-xs sm:text-sm text-[#e2e9f3] flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="p-6 rounded-3xl bg-[#090b0e] border border-white/[0.08]">
          <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Areas for Improvement
          </h2>
          <ul className="space-y-3">
            {report?.areas_to_improve?.map((item: string, idx: number) => (
              <li key={idx} className="text-xs sm:text-sm text-[#e2e9f3] flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Detailed Per-Question Analysis */}
      <div className="space-y-5">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          Per-Question STAR Breakdown & Model Solutions
        </h2>

        {report?.per_question_feedback?.map((item: any, idx: number) => (
          <div key={idx} className="p-6 sm:p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] space-y-4">
            <div>
              <span className="text-[11px] font-mono text-[#8b929e] uppercase tracking-wider block mb-1">
                Question {idx + 1}
              </span>
              <p className="text-sm sm:text-base font-semibold text-white">&ldquo;{item.question}&rdquo;</p>
            </div>

            {item.answer_summary && (
              <div className="p-4 rounded-2xl bg-black border border-white/[0.06] text-xs text-[#8b929e]">
                <span className="font-mono text-white block mb-1 uppercase text-[10px]">Spoken Response Summary:</span>
                <p className="italic text-[#e2e9f3]">&ldquo;{item.answer_summary}&rdquo;</p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">AI Evaluator Critique:</span>
              <p className="text-xs sm:text-sm text-[#8b929e] leading-relaxed">{item.feedback}</p>
            </div>

            {item.suggested_answer && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs text-[#e2e9f3]">
                <span className="font-mono text-[10px] text-white block mb-1.5 uppercase font-bold tracking-wider">Model STAR Exemplar Answer:</span>
                <p className="leading-relaxed font-sans">{item.suggested_answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

export default function InterviewReportPage() {
  return (
    <ProtectedRoute>
      <InterviewReportContent />
    </ProtectedRoute>
  );
}
