'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Check, Sparkles, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

// Helper to dynamically load external script
const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingPage() {
  const { user, subscription, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Preload Razorpay Checkout.js
    loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/signup');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      // 1. Ensure Razorpay script loaded
      const isLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!isLoaded) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      // 2. Call backend to create Razorpay Order
      const res = await api.post('/api/payments/create-order', {
        currency: currency,
        plan: 'pro'
      });

      const { order_id, amount, key_id } = res.data;

      // 3. Launch official Razorpay Checkout Modal
      const options = {
        key: key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TU1Fefzjmx53sl',
        amount: amount,
        currency: currency,
        name: 'IntervuAI',
        description: 'Pro Subscription — Unlimited Mock Interviews & PDF Reports',
        order_id: order_id,
        handler: async function (response: any) {
          try {
            // 4. Call backend to cryptographically verify payment signature
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            await refreshUser();
            router.push('/dashboard');
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            alert('Payment received but verification encountered an issue. Refreshing profile...');
            await refreshUser();
            router.push('/dashboard');
          }
        },
        prefill: {
          name: user.full_name || '',
          email: user.email,
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpayWindow = new (window as any).Razorpay(options);
      razorpayWindow.on('payment.failed', function (resp: any) {
        setErrorMsg(`Payment failed: ${resp.error.description || 'Transaction was declined.'}`);
        setLoading(false);
      });
      razorpayWindow.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  const isPro = subscription?.plan === 'pro';

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-16 flex flex-col items-center bg-black relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[#e2e9f3] text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Subscription Plans
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
          Invest in High-Impact Interview Prep
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#8b929e]">
          Practice out loud with real-time telemetry. Level up your technical delivery and pacing.
        </p>

        {errorMsg && (
          <div className="mt-6 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Currency Switcher */}
        <div className="mt-6 inline-flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-full">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-4 py-1 rounded-full text-xs font-mono transition-all duration-190 ${
              currency === 'INR' ? 'bg-white text-black font-semibold shadow' : 'text-[#8b929e] hover:text-white'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1 rounded-full text-xs font-mono transition-all duration-190 ${
              currency === 'USD' ? 'bg-white text-black font-semibold shadow' : 'text-[#8b929e] hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* Free Tier Card */}
        <div className="rounded-3xl bg-[#090b0e] border border-white/[0.08] p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Starter Free</h2>
              <span className="text-[11px] font-mono text-[#8b929e] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                Free Forever
              </span>
            </div>
            <p className="text-xs text-[#8b929e] mb-6">
              Evaluate your conversational readiness with voice mock sessions.
            </p>

            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white font-mono">{currency === 'INR' ? '₹0' : '$0'}</span>
              <span className="text-[#8b929e] text-xs font-mono">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-[#e2e9f3] mb-8 border-t border-white/[0.08] pt-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong>2 voice mock sessions</strong> / month</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Live speech metrics (Pace WPM, Filler words)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Standard technical role question banks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Summary readiness scores</span>
              </li>
              <li className="flex items-center gap-2.5 text-[#575e6b]">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">✕</span>
                <span className="line-through">Downloadable PDF reports</span>
              </li>
              <li className="flex items-center gap-2.5 text-[#575e6b]">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">✕</span>
                <span className="line-through">Resume-tailored custom questions</span>
              </li>
            </ul>
          </div>

          <Link
            href={user ? "/interview/new" : "/signup"}
            className="w-full py-3 px-4 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.24] text-center text-xs font-semibold text-white transition-all duration-190"
          >
            {user ? "Current Free Plan" : "Get Started Free"}
          </Link>
        </div>

        {/* Pro Tier Card */}
        <div className="rounded-3xl bg-[#0d0f12] border-2 border-white/[0.2] p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(255,255,255,0.06)]">
          
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-white text-black text-[10px] font-mono font-bold uppercase tracking-wider shadow">
            Recommended
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pro Unlimited
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
            <p className="text-xs text-[#8b929e] mb-6">
              Full unconstrained practice with resume-tailored questions and PDF exports.
            </p>

            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white font-mono">
                {currency === 'INR' ? '₹299' : '$4.99'}
              </span>
              <span className="text-[#8b929e] text-xs font-mono">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-[#e2e9f3] mb-8 border-t border-white/[0.08] pt-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span><strong className="text-white">Unlimited voice mock sessions</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span><strong>Resume-tailored</strong> question generation</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Per-question <strong>STAR critiques & model answers</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span><strong>Exportable PDF reports</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Historical readiness trends</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span>Priority LLM inference</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading || isPro}
            className="w-full py-3 px-4 rounded-full bg-white hover:bg-[#e2e9f3] active:scale-[0.98] disabled:opacity-50 text-center text-xs font-bold text-black shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-190 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPro ? (
              <>
                <Shield className="w-3.5 h-3.5 text-black" />
                Pro Active
              </>
            ) : (
              <>
                Upgrade to Pro (Razorpay)
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>

      <p className="text-[11px] text-[#575e6b] font-mono mt-12 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5" />
        Secured via Razorpay Sandbox. Test cards: 4111 1111 1111 1111 (any valid future expiry & CVV).
      </p>

    </div>
  );
}
