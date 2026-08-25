'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mic, ArrowRight, Lock, Mail, User, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup, googleLogin } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, password, fullName);
      router.push('/interview/new');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin('demo@intervuai.com', 'Demo Candidate');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-black relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-[#090b0e] border border-white/[0.1] p-8 rounded-3xl shadow-2xl relative">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black font-bold mb-4 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Mic className="w-5 h-5 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-xs text-[#8b929e] mt-1.5">Start your voice mock practice in seconds</p>
        </div>

        {/* Feature Pills */}
        <div className="mb-6 grid grid-cols-2 gap-2 text-[11px] font-mono text-[#8b929e]">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>2 Free Sessions/mo</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Live Speech Telemetry</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#575e6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-black border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#575e6b] focus:border-white/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#575e6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-black border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#575e6b] focus:border-white/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#8b929e] tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#575e6b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-black border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#575e6b] focus:border-white/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-black bg-white hover:bg-[#e2e9f3] active:scale-[0.98] disabled:opacity-50 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-190 mt-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Free Account
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-[#090b0e] px-3 text-[#575e6b]">Or Fast Track</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium text-[#e2e9f3] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] py-2.5 rounded-full transition-all duration-190"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Continue with 1-Click Demo Account
        </button>

        <p className="text-center text-xs text-[#8b929e] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline underline-offset-4 font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
