'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Mic,
  Sparkles,
  Award,
  Clock,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SessionItem {
  id: string;
  role: string;
  difficulty: string;
  status: string;
  started_at: string;
  duration_seconds?: number;
  overall_score?: number;
  filler_word_count?: number;
  avg_pace_wpm?: number;
}

function DashboardContent() {
  const { user, subscription, usage } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await api.get('/api/sessions');
        setSessions(res.data?.sessions || []);
      } catch (err) {
        console.error('Failed to fetch past sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const isPro = subscription?.plan === 'pro';

  const completedSessions = sessions.filter(s => s.status === 'completed' || s.overall_score);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overall_score || 75), 0) / completedSessions.length)
    : 0;
  const avgPace = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.avg_pace_wpm || 135), 0) / completedSessions.length)
    : 135;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-white animate-spin mb-3" />
        <p className="text-xs text-[#8b929e] font-mono">Loading telemetry dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 bg-black">
      
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-[#090b0e] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#e2e9f3] text-[11px] font-mono uppercase mb-3">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Candidate Cockpit
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome, {user?.full_name || user?.email?.split('@')[0] || 'Candidate'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8b929e] mt-1.5 max-w-xl leading-relaxed">
            Review your speech cadence telemetry, analyze AI STAR evaluation reports, and track readiness.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] text-black text-xs font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-190 flex-shrink-0"
        >
          <Mic className="w-3.5 h-3.5 fill-current" />
          Start New Interview
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sessions */}
        <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[#8b929e] text-[11px] font-mono uppercase">
            <span>Interviews Done</span>
            <Layers className="w-3.5 h-3.5 text-[#8b929e]" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white font-mono">{sessions.length}</div>
          <span className="text-[10px] text-[#575e6b] font-mono mt-1 block">Recorded sessions</span>
        </div>

        {/* Avg Readiness Score */}
        <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[#8b929e] text-[11px] font-mono uppercase">
            <span>Average Score</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white font-mono">
            {avgScore > 0 ? `${avgScore}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">STAR readiness</span>
        </div>

        {/* Avg Pace */}
        <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08]">
          <div className="flex justify-between items-center text-[#8b929e] text-[11px] font-mono uppercase">
            <span>Average Pace</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white font-mono">
            {avgPace} <span className="text-xs font-normal text-[#8b929e]">WPM</span>
          </div>
          <span className="text-[10px] text-[#575e6b] font-mono mt-1 block">Conversational cadence</span>
        </div>

        {/* Plan Status */}
        <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex justify-between items-center text-[#8b929e] text-[11px] font-mono uppercase">
            <span>Active Plan</span>
            <Shield className="w-3.5 h-3.5 text-[#8b929e]" />
          </div>
          <div>
            <div className="mt-2 text-lg font-bold text-white flex items-center gap-1.5">
              {isPro ? (
                <span className="text-white font-mono">Pro Unlimited</span>
              ) : (
                <span className="text-[#8b929e] font-mono">Starter Free</span>
              )}
            </div>
            {!isPro ? (
              <Link href="/pricing" className="text-[11px] text-white hover:underline font-mono mt-1 inline-flex items-center gap-1">
                Upgrade to Pro &rarr;
              </Link>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono">Unlimited active</span>
            )}
          </div>
        </div>

      </div>

      {/* Plan Usage Notification */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-[#090b0e] border border-white/[0.1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white font-mono">Free Tier Usage: {usage?.sessionsThisMonth || 0} / 2 Interviews used</p>
              <p className="text-xs text-[#8b929e]">Upgrade to Pro for unlimited sessions, custom resume prompts, and PDF exports.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#e2e9f3] transition-all flex-shrink-0"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Session History Table */}
      <div className="rounded-3xl bg-[#090b0e] border border-white/[0.08] overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] flex justify-between items-center">
          <h2 className="text-sm font-bold text-white tracking-tight">Interview History & Reports</h2>
          <span className="text-[11px] font-mono text-[#8b929e]">{sessions.length} sessions</span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Mic className="w-8 h-8 text-[#575e6b] mb-3" />
            <h3 className="text-xs font-semibold text-white">No interview sessions recorded</h3>
            <p className="text-xs text-[#8b929e] max-w-sm mt-1 mb-5">
              Launch your first voice AI mock session to receive speech analytics and feedback.
            </p>
            <Link
              href="/interview/new"
              className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#e2e9f3] transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              Start Free Interview
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{s.role}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-[#8b929e] capitalize">
                      {s.difficulty}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#575e6b] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {s.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(s.duration_seconds / 60)} mins
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  {s.overall_score && (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#8b929e] uppercase block">Score</span>
                      <span className="text-sm font-bold text-white font-mono">{s.overall_score}/100</span>
                    </div>
                  )}

                  <Link
                    href={`/report/${s.id}`}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.2] text-[#e2e9f3] text-xs font-medium flex items-center gap-1.5 transition-all duration-190"
                  >
                    <span>View Report</span>
                    <ChevronRight className="w-3 h-3 text-[#8b929e]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
