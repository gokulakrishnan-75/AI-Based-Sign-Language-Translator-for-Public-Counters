import React from 'react';
import { ShieldCheck, Heart, Cpu, Sparkles, Lock, Accessibility } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-white/10 bg-[#050811] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-wide">
                SIGNBRIDGE <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Autonomous deep learning-based sign language translation platform engineered for public service counters, hospitals, banks, and transport hubs.
            </p>
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>35 Public Service Signs Supported</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActivePage('translator')} className="hover:text-cyan-300 transition-colors">
                  Live Translator
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('library')} className="hover:text-cyan-300 transition-colors">
                  Sign Language Library
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('counter')} className="hover:text-cyan-300 transition-colors">
                  Public Service Counter Mode
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('studio')} className="hover:text-cyan-300 transition-colors">
                  Dataset Studio (Custom Capture)
                </button>
              </li>
            </ul>
          </div>

          {/* AI Architecture & Docs */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">AI & Benchmarks</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActivePage('performance')} className="hover:text-cyan-300 transition-colors">
                  Model Performance & Confusion Matrix
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('how-it-works')} className="hover:text-cyan-300 transition-colors">
                  How It Works (6-Step Pipeline)
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('dashboard')} className="hover:text-cyan-300 transition-colors">
                  Telemetry & Real-Time Stats
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Accessibility Assurance */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Privacy & Trust</h4>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight text-slate-300">
                <span className="font-semibold text-white block mb-0.5">Privacy First</span>
                Camera frames are processed in volatile memory and are not stored unless explicitly recorded in Dataset Studio.
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Complies with WCAG 2.1 AA accessibility standards for color contrast and assistive screen readers.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-[11px]">
            © 2026 SIGNBRIDGE AI. Built for accessibility at public service counters.
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              MediaPipe Hands + Deep Neural Classifier
            </span>
            <span>•</span>
            <span>Zero Fabricated Benchmarks</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
