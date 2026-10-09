import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  BookOpen, 
  Users, 
  Database, 
  BarChart3, 
  Cpu, 
  HelpCircle, 
  Sun, 
  Moon, 
  Type, 
  Eye, 
  Radio, 
  ShieldCheck, 
  Menu, 
  X,
  Play
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ activePage, setActivePage, onOpenDemo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    async function checkBackend() {
      const res = await api.getHealth();
      if (res && res.status === 'online') {
        setBackendStatus('online');
      } else {
        setBackendStatus('client-mode');
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'translator', label: 'Live Translator', icon: Video, badge: 'LIVE' },
    { id: 'library', label: 'Sign Library', icon: BookOpen },
    { id: 'counter', label: 'Public Counter', icon: Users, badge: 'STAFF' },
    { id: 'studio', label: 'Dataset Studio', icon: Database },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'performance', label: 'Model Performance', icon: Cpu },
    { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070C18]/90 backdrop-blur-xl border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Product Identity */}
          <div 
            onClick={() => setActivePage('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full bg-[#070C18] rounded-[10px] flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#070C18]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  SIGNBRIDGE <span className="text-cyan-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide hidden sm:block">
                Autonomous Sign Language Translation for Public Counters
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      item.badge === 'LIVE' ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Hackathon Demo & Accessibility */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Hackathon Demo CTA Button */}
            <button
              onClick={onOpenDemo}
              className="relative inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg text-black bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all shadow-md shadow-cyan-500/30 hover:scale-[1.03] active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>HACKATHON DEMO</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-900 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
              </span>
            </button>

            {/* Accessibility: High Contrast & Large Text */}
            <div className="flex items-center bg-[#0D1527] rounded-lg p-1 border border-white/10 space-x-1">
              <button
                onClick={toggleHighContrast}
                title="Toggle High Contrast Mode (Accessibility)"
                className={`p-1.5 rounded text-xs transition-colors ${
                  highContrast ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={toggleLargeText}
                title="Toggle Large Text Mode (Accessibility)"
                className={`p-1.5 rounded text-xs transition-colors ${
                  largeText ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Backend / Model Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1527] border border-white/5 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`} />
              <span className="text-slate-400 font-mono text-[10px]">
                {backendStatus === 'online' ? 'API READY' : 'ON-DEVICE ML'}
              </span>
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenDemo}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-black bg-gradient-to-r from-cyan-400 to-blue-400"
            >
              DEMO
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0F1D] border-b border-white/10 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-3 flex gap-2 border-t border-white/10">
            <button
              onClick={toggleHighContrast}
              className="flex-1 py-2 text-xs font-medium text-slate-300 bg-white/5 rounded-lg text-center"
            >
              High Contrast
            </button>
            <button
              onClick={toggleLargeText}
              className="flex-1 py-2 text-xs font-medium text-slate-300 bg-white/5 rounded-lg text-center"
            >
              Large Text
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
