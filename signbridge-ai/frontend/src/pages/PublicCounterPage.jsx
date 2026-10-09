import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  Send, 
  Building2, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  UserCheck, 
  Check, 
  Trash2,
  ChevronRight,
  Languages,
  Globe
} from 'lucide-react';
import { speechService } from '../services/speech';
import { api } from '../services/api';
import { SUPPORTED_LANGUAGES, translateSentence } from '../data/translations';

export default function PublicCounterPage({ setActivePage }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [activeCitizenMessage, setActiveCitizenMessage] = useState(
    "HELLO I NEED HELP WHERE RESTROOM"
  );
  const [citizenTokens, setCitizenTokens] = useState(["HELLO", "I", "NEED", "HELP", "WHERE", "RESTROOM"]);
  const [citizenConfidence, setCitizenConfidence] = useState(94.8);
  const [staffResponseText, setStaffResponseText] = useState("");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [confirmedStatus, setConfirmedStatus] = useState(false);

  // Quick preset answers for public counter clerks
  const quickStaffReplies = [
    "Please wait a moment while I pull up your file.",
    "The accessible restroom is straight down Corridor B on your right.",
    "Please show your government identity card or token.",
    "Your token number has been registered for counter 4.",
    "The railway ticket counter is on platform level 1.",
    "A doctor will assist you at triage room 3."
  ];

  useEffect(() => {
    async function loadSessions() {
      const res = await api.getCounterHistory();
      if (res && res.sessions) {
        setSessionHistory(res.sessions);
      }
    }
    loadSessions();
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  const translated = translateSentence(citizenTokens, selectedLang);

  const handleSpeakCitizenMessage = () => {
    const textToSpeak = selectedLang === 'en' ? activeCitizenMessage : (translated.spoken || translated.text || activeCitizenMessage);
    speechService.speak(textToSpeak, currentLangObj.locale);
  };

  const handleSpeakStaffReply = (textToSpeak = null) => {
    const text = textToSpeak || staffResponseText;
    if (!text) return;
    speechService.speak(text, currentLangObj.locale);

    // Save to active session
    const newEntry = {
      id: `sess-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      counter: "Counter 03 (Active Public Desk)",
      citizen_text: activeCitizenMessage,
      spoken_text: activeCitizenMessage,
      staff_response: text,
      confidence: citizenConfidence,
      status: "Resolved"
    };

    setSessionHistory(prev => [newEntry, ...prev]);
    setStaffResponseText("");
  };

  const handleNewUser = () => {
    setActiveCitizenMessage("HELLO PLEASE ASSIST");
    setCitizenTokens(["HELLO", "PLEASE", "ASSIST"]);
    setCitizenConfidence(96.2);
    setConfirmedStatus(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Counter Mode Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-[#0D1527] to-[#0A1226] border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-400 text-black font-bold">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                Public Service Terminal
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Public Service Counter Mode (Two-Way Desk)
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Optimized interface for service officers and citizens. Real-time sign translation paired with synthesized voice response.
          </p>
        </div>

        {/* Counter Info, Language Picker & Reset */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Language Toggle */}
          <div className="flex items-center gap-1 bg-[#070C18] p-1 rounded-xl border border-white/10">
            <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5" />
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  selectedLang === lang.code
                    ? 'bg-cyan-400 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={lang.name}
              >
                <span>{lang.flag}</span>
                <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right hidden sm:block">
            <div className="text-[10px] font-mono text-slate-400">ASSIGNED DESK</div>
            <div className="text-xs font-bold text-white">Counter #03 (Citizen Help)</div>
          </div>
          <button
            onClick={handleNewUser}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md"
          >
            <UserCheck className="w-4 h-4" />
            <span>Next Citizen</span>
          </button>
        </div>
      </div>

      {/* Main Two-Way Grid: Citizen Side A | Staff Side B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDE A: Citizen Sign Language Stream -> Text (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-white/10 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  SIDE A: Citizen Sign Language Input
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-400 border border-white/10">
                  {currentLangObj.flag} {currentLangObj.name.split(' ')[0]}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {citizenConfidence}% Confidence
                </span>
              </div>
            </div>

            {/* Extra Large High-Visibility Citizen Text */}
            <div className="p-6 rounded-2xl bg-[#070C18] border border-white/10 min-h-[140px] flex flex-col justify-center space-y-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 mb-1 block">
                  Original Recognized Sign Stream:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-wide leading-snug">
                  "{activeCitizenMessage}"
                </div>
              </div>

              {selectedLang !== 'en' && translated.text && (
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block mb-1">
                    {currentLangObj.name} Translation:
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-200">
                    "{translated.text}"
                  </div>
                </div>
              )}
            </div>

            {/* Detected Signs Breakdown Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Detected Signs:</span>
              <div className="flex flex-wrap items-center gap-2">
                {citizenTokens.map((token, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold"
                  >
                    {token}
                  </span>
                ))}
              </div>
            </div>

            {/* Side A Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakCitizenMessage}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 Speak Message</span>
                </button>

                <button
                  onClick={() => setConfirmedStatus(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{confirmedStatus ? 'Confirmed' : 'Confirm'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setActiveCitizenMessage("");
                  setCitizenTokens([]);
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

          </div>
        </div>

        {/* SIDE B: Staff Response -> Voice Synthesis (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-cyan-500/20 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  SIDE B: Staff Response (Speech)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Two-Way Voice</span>
            </div>

            {/* Quick Answer Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Quick Reply Presets:</span>
              <div className="space-y-2">
                {quickStaffReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSpeakStaffReply(reply)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{reply}</span>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Staff Text Input */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-slate-400">Custom Clerk Message:</span>
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={staffResponseText}
                  onChange={(e) => setStaffResponseText(e.target.value)}
                  placeholder="Type any message to citizen (will be spoken aloud)..."
                  className="w-full p-3 rounded-xl bg-[#070C18] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
                <button
                  onClick={() => handleSpeakStaffReply()}
                  disabled={!staffResponseText.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Speak Response to Citizen</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Counter Session Audit History */}
      <div className="p-6 rounded-3xl bg-[#0D1527]/70 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Recent Counter Intercom Log</h3>
          </div>
          <span className="text-xs text-slate-400">{sessionHistory.length} interactions recorded</span>
        </div>

        <div className="space-y-3">
          {sessionHistory.slice(0, 5).map((sess, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#070C18] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{sess.counter}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{sess.timestamp}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Citizen: </span>
                  <span className="font-semibold text-cyan-300">"{sess.citizen_text}"</span>
                </div>
                {sess.staff_response && (
                  <div className="text-slate-300">
                    <span className="text-slate-500">Staff: </span>
                    <span>"{sess.staff_response}"</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/20">
                  {sess.confidence}% Conf
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-[11px]">
                  {sess.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
