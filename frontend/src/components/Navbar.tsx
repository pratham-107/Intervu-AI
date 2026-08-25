'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mic, Sparkles, LogOut, ArrowRight, User, AudioWaveform } from 'lucide-react';

export default function Navbar() {
  const { user, subscription, logout } = useAuth();
  const pathname = usePathname();

  const isPro = subscription?.plan === 'pro';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group focus-visible:rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-200">
            <Mic className="w-4 h-4 text-black fill-current" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white tracking-tight">
              Intervu<span className="text-[#8b929e]">AI</span>
            </span>
            {isPro && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 rounded-full tracking-wider uppercase">
                PRO
              </span>
            )}
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[#8b929e]">
          <Link
            href="/#features"
            className={`px-3.5 py-1.5 rounded-full transition-all duration-190 hover:text-white ${
              pathname === '/#features' ? 'bg-white/10 text-white' : ''
            }`}
          >
            Capabilities
          </Link>
          <Link
            href="/pricing"
            className={`px-3.5 py-1.5 rounded-full transition-all duration-190 hover:text-white ${
              pathname === '/pricing' ? 'bg-white/10 text-white' : ''
            }`}
          >
            Pricing
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`px-3.5 py-1.5 rounded-full transition-all duration-190 hover:text-white ${
                  pathname === '/dashboard' ? 'bg-white/10 text-white' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/interview/new"
                className={`px-3.5 py-1.5 rounded-full transition-all duration-190 flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 border border-white/10`}
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Practice
              </Link>
            </>
          )}
        </nav>

        {/* Auth CTA / User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all text-xs text-[#e2e9f3]"
              >
                <User className="w-3.5 h-3.5 text-[#8b929e]" />
                <span className="font-medium">{user.full_name || user.email.split('@')[0]}</span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-[#8b929e] hover:text-white transition-colors duration-190"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-[#8b929e] hover:text-white px-3.5 py-2 rounded-full transition-colors duration-190"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 text-xs font-semibold text-black bg-white hover:bg-[#e2e9f3] active:scale-[0.98] px-4 py-2 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-190"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
