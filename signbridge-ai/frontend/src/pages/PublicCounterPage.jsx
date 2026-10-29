import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Globe,
  Camera,
  CameraOff,
  Radio,
  Lock,
  ArrowRight,
  Zap,
  VolumeX,
  Bot,
  User,
  ShieldCheck,
  Compass
} from 'lucide-react';
import CameraView from '../components/CameraView';
import { clientInferenceEngine } from '../services/clientInference';
import { ClientStabilizer } from '../services/clientStabilizer';
import { speechService } from '../services/speech';
import { api } from '../services/api';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { detectCitizenSentence, getCorrectStaffReply } from '../services/counterEngine';

export default function PublicCounterPage({ 
  setActivePage,
  forwardedTokens = null,
  onClearForwarded = null
}) {
  const [selectedLang, setSelectedLang] = useState('en');
  
  // Side A: Citizen Sign State (Initialized with forwarded signs from Live Translator, or clean empty array)
  const [citizenTokens, setCitizenTokens] = useState(() => {
    if (forwardedTokens && Array.isArray(forwardedTokens) && forwardedTokens.length > 0) {
      return [...forwardedTokens];
    }
    try {
      const saved = sessionStorage.getItem('signbridge_forwarded_signs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return []; // Clean empty start - only detected/forwarded signs!
  });

  // Sync when forwardedTokens prop updates
  useEffect(() => {
    if (forwardedTokens && Array.isArray(forwardedTokens)) {
      setCitizenTokens([...forwardedTokens]);
    }
  }, [forwardedTokens]);

  // Read and consume sessionStorage forwarded signs on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('signbridge_forwarded_signs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCitizenTokens(parsed);
          sessionStorage.removeItem('signbridge_forwarded_signs');
        }
      }
    } catch (e) {}
  }, []);

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [stabilizedResult, setStabilizedResult] = useState({
    stabilizedSign: null,
    rawSign: 'NONE',
    confidence: 0,
    status: 'No Hand Detected',
    message: 'Position hand inside camera frame',
    isHolding: false
  });
  const [isSigningActive, setIsSigningActive] = useState(false);
  const [autoSpeakCitizen, setAutoSpeakCitizen] = useState(false);
  const [requireIndexTrigger, setRequireIndexTrigger] = useState(false);
  const [triggerToast, setTriggerToast] = useState(null);
  const wasTriggerActiveRef = useRef(false);

  // Sync refs for high-frequency camera frame callback
  const requireIndexTriggerRef = useRef(requireIndexTrigger);
  useEffect(() => {
    requireIndexTriggerRef.current = requireIndexTrigger;
  }, [requireIndexTrigger]);

  const isCameraActiveRef = useRef(isCameraActive);
  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  // Side B: Staff Response State
  const [staffResponseText, setStaffResponseText] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isStaffSpeaking, setIsStaffSpeaking] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Performance telemetry
  const [fps, setFps] = useState(30);
  const [latency, setLatency] = useState(1);

  // Timer ref for silence / sentence completion debounce
  const silenceTimerRef = useRef(null);

  // Stabilizer with strict single-prediction debounce (no continuous repeating while holding!)
  const stabilizerRef = useRef(new ClientStabilizer({
    windowSize: 5,
    confidenceThreshold: 45.0,
    requiredStreak: 2,
    cooldownMs: 1200
  }));

  // Automatic Sentence Detection from accumulated citizen signs
  const citizenAnalysis = detectCitizenSentence(citizenTokens, selectedLang);

  // Automatic derivation of the CORRECT Reply from Side B Counter
  const correctReplyData = getCorrectStaffReply(citizenAnalysis, selectedLang);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  // Load counter interaction log from backend
  useEffect(() => {
    async function loadSessions() {
      const res = await api.getCounterHistory();
      if (res && res.sessions && res.sessions.length > 0) {
        setSessionHistory(res.sessions);
      }
    }
    loadSessions();
  }, []);

  // When a complete sentence is finalized, trigger Auto-Reply if enabled
  const finalizeAndTriggerReply = useCallback((tokensToUse) => {
    const analysis = detectCitizenSentence(tokensToUse, selectedLang);
    if (!analysis.isComplete) return;

    const reply = getCorrectStaffReply(analysis, selectedLang);

    // If auto-reply is on, speak the correct staff reply aloud to citizen
    if (autoReplyEnabled) {
      setIsStaffSpeaking(true);
      speechService.playChime('confirm');
      setTimeout(() => {
        speechService.speak(reply.spokenReply, currentLangObj.locale, () => {
          setIsStaffSpeaking(false);
        });
      }, 400);
    }

    // Record interaction in history
    const newEntry = {
      id: `sess-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      counter: "Counter #03 (Citizen Help)",
      citizen_text: analysis.detectedSentence,
      spoken_text: analysis.detectedSentence,
      staff_response: reply.replyText,
      confidence: analysis.confidence,
      status: "Resolved"
    };

    setSessionHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    api.postCounterMessage(newEntry);
  }, [selectedLang, autoReplyEnabled, currentLangObj]);

  const lastActiveSignRef = useRef(null);

  // Handle incoming hand landmarks from Side A Camera
  const handleLandmarksDetected = useCallback(async (landmarks, multiAnalysis = null) => {
    if (!isCameraActiveRef.current) return;

    let activeSign = null;

    if (landmarks) {
      // 1. Run inference (Client-side forward pass or API fallback)
      let rawPred = clientInferenceEngine.predict(landmarks);
      if (!rawPred) {
        try {
          rawPred = await api.predictLandmarks(landmarks);
        } catch (e) {}
      }

      if (rawPred) {
        setCurrentPrediction(rawPred);
        if (rawPred.latency_ms !== undefined) setLatency(rawPred.latency_ms);

        // 2. Run stabilization with strict single prediction
        const stabilized = stabilizerRef.current.process(rawPred);
        setStabilizedResult(stabilized);

        activeSign = stabilized.stabilizedSign || (rawPred.confidence >= 48 ? rawPred.sign : null);
        if (activeSign) {
          lastActiveSignRef.current = activeSign;
        }

        // 3. INDEX FINGER COMMIT TRIGGER vs SINGLE PREDICTION AUTO-ADD
        if (requireIndexTriggerRef.current) {
          if (multiAnalysis?.isTriggerActive) {
            if (!wasTriggerActiveRef.current) {
              wasTriggerActiveRef.current = true;
              const signToCommit = activeSign || lastActiveSignRef.current;
              if (signToCommit) {
                setCitizenTokens(prev => {
                  if (prev.length > 0 && prev[prev.length - 1] === signToCommit) return prev;
                  const updated = [...prev, signToCommit];
                  finalizeAndTriggerReply(updated);
                  return updated;
                });

                speechService.playChime('confirm');
                setTriggerToast({ sign: signToCommit, timestamp: Date.now() });
                setTimeout(() => setTriggerToast(null), 2500);
              }
            }
          } else {
            wasTriggerActiveRef.current = false;
          }
        } else {
          // Direct single-prediction auto-add using fresh stabilized object
          if (stabilized.shouldEmit && stabilized.stabilizedSign) {
            const newSign = stabilized.stabilizedSign;

            setCitizenTokens(prev => {
              if (prev.length > 0 && prev[prev.length - 1] === newSign) {
                return prev;
              }
              const updated = [...prev, newSign];
              setIsSigningActive(true);

              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                setIsSigningActive(false);
                finalizeAndTriggerReply(updated);
              }, 1800);

              return updated;
            });

            speechService.playChime('confirm');
          }
        }
      }
    } else {
      const emptyResult = stabilizerRef.current.process(null);
      setStabilizedResult(emptyResult);
      setCurrentPrediction(null);
      wasTriggerActiveRef.current = false;
    }
  }, [finalizeAndTriggerReply]);

  // Manual quick test chips
  const handleQuickAddSign = (signName) => {
    const upper = signName.toUpperCase();
    setCitizenTokens(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === upper) return prev;
      const updated = [...prev, upper];
      setIsSigningActive(true);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        setIsSigningActive(false);
        finalizeAndTriggerReply(updated);
      }, 1500);

      return updated;
    });
    speechService.playChime('confirm');
  };

  const handleApplyPresetInquiry = (tokens) => {
    setCitizenTokens(tokens);
    stabilizerRef.current.reset();
    setIsSigningActive(false);
    speechService.playChime('confirm');
    setTimeout(() => {
      finalizeAndTriggerReply(tokens);
    }, 200);
  };

  const handleSpeakCitizenMessage = () => {
    if (!citizenAnalysis.detectedSentence) return;
    speechService.speak(citizenAnalysis.spokenText, currentLangObj.locale);
  };

  const handleSpeakStaffReply = (textToSpeak = null) => {
    const text = textToSpeak || staffResponseText || correctReplyData.spokenReply;
    if (!text) return;

    setIsStaffSpeaking(true);
    speechService.speak(text, currentLangObj.locale, () => {
      setIsStaffSpeaking(false);
    });

    // Save entry to session history
    const newEntry = {
      id: `sess-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      counter: "Counter #03 (Citizen Help)",
      citizen_text: citizenAnalysis.detectedSentence || citizenTokens.join(" "),
      spoken_text: citizenAnalysis.detectedSentence || citizenTokens.join(" "),
      staff_response: text,
      confidence: citizenAnalysis.confidence || 95.0,
      status: "Resolved"
    };

    setSessionHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    setStaffResponseText("");
    api.postCounterMessage(newEntry);
  };

  const handleNewUser = () => {
    setCitizenTokens(["HELLO", "HELP"]);
    stabilizerRef.current.reset();
    setIsSigningActive(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    speechService.playChime('confirm');
  };

  const handleClearCitizen = () => {
    setCitizenTokens([]);
    stabilizerRef.current.reset();
    setIsSigningActive(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const handleUndoCitizen = () => {
    setCitizenTokens(prev => prev.slice(0, -1));
    stabilizerRef.current.unlock();
  };

  // Quick Preset Inquiries for Demo / Testing
  const DEMO_INQUIRIES = [
    { label: "💊 Medicine Help", tokens: ["HELLO", "MEDICINE", "HELP"] },
    { label: "🚹 Restroom", tokens: ["WHERE", "RESTROOM"] },
    { label: "💧 Water", tokens: ["WATER", "PLEASE"] },
    { label: "🚆 Railway Ticket", tokens: ["TICKET", "RAILWAY"] },
    { label: "🩺 Doctor/Pain", tokens: ["DOCTOR", "PLEASE"] },
    { label: "🚨 Emergency", tokens: ["HELP", "EMERGENCY"] },
    { label: "🏦 Bank/Fees", tokens: ["WHERE", "BANK"] },
    { label: "♿ Wheelchair", tokens: ["WHEELCHAIR", "PLEASE"] },
    { label: "❤️ Thank You", tokens: ["THANK YOU"] }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-[#0D1527] to-[#0A1226] border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-cyan-400 text-black font-extrabold shadow-lg shadow-cyan-400/20">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Two-Way Interactive Counter Intercom
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Public Service Counter Mode (Side A & Side B)
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Side A receives citizen sign language, automatically generates grammatical sentences, and Side B derives the verified correct clerk reply with synchronized voice intercom.
          </p>
        </div>

        {/* Counter Info, Language Toggle & Next Citizen */}
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

          <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right hidden sm:block">
            <div className="text-[10px] font-mono text-cyan-400 font-bold">ACTIVE TERMINAL</div>
            <div className="text-xs font-bold text-white">Counter #03 (Citizen Desk)</div>
          </div>

          <button
            onClick={handleNewUser}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-400/20 active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Next Citizen</span>
          </button>
        </div>
      </div>

      {/* Main Two-Way Grid: Citizen Side A | Staff Side B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =================================================================== */}
        {/* SIDE A: Citizen Sign Language Input & Sentence Formulation (7 cols) */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-cyan-500/20 shadow-2xl space-y-6">
            
            {/* Side A Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 block">
                    SIDE A: Citizen Sign Language Stream
                  </span>
                  <span className="text-[11px] text-slate-400">
                    One-time gesture recognition • Auto sentence assembly
                  </span>
                </div>
              </div>

              {/* Camera on/off and Index Trigger toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRequireIndexTrigger(!requireIndexTrigger)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    requireIndexTrigger
                      ? 'bg-emerald-400 text-black border-emerald-400 font-bold shadow-md shadow-emerald-400/20'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                  title="When active, raise Right Hand index finger (☝️) to commit sign to sentence"
                >
                  <span>☝️</span>
                  <span>{requireIndexTrigger ? 'Right Trigger: ON' : 'Trigger: OFF'}</span>
                </button>

                <button
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isCameraActive 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  }`}
                >
                  {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                  <span>{isCameraActive ? 'Camera ON' : 'Camera Paused'}</span>
                </button>
              </div>
            </div>

            {/* Trigger Confirmation Toast */}
            {triggerToast && (
              <div className="p-3 rounded-2xl bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>☝️ Index Finger Trigger Detected! Added "{triggerToast.sign}" to Citizen Sentence!</span>
              </div>
            )}

            {/* Embedded Live Camera View with Biometric Overlay */}
            {isCameraActive ? (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner relative">
                <CameraView
                  onLandmarksDetected={handleLandmarksDetected}
                  fps={fps}
                  latency={latency}
                  currentSign={stabilizedResult.stabilizedSign || currentPrediction?.sign}
                  confidence={stabilizedResult.confidence || currentPrediction?.confidence || 0}
                  status={stabilizedResult.status}
                  identifiedSign={stabilizedResult.stabilizedSign}
                  triggerHand="Right"
                  requireIndexTrigger={requireIndexTrigger}
                />
                
                {/* Live Single-Prediction HUD Status Banner */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  {stabilizedResult.isHolding ? (
                    <span className="px-3 py-1 rounded-lg bg-blue-500/80 backdrop-blur-md text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked (1x Captured) • Release Hand or Switch Sign</span>
                    </span>
                  ) : stabilizedResult.stabilizedSign ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{stabilizedResult.stabilizedSign} (Captured 1x)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-slate-300 font-mono text-[11px]">
                      Show sign gesture to Counter Camera
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-cyan-300 font-mono text-[11px]">
                    Single Prediction Lock: Active
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#070C18] border border-white/10 text-center space-y-3">
                <CameraOff className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  Side A camera is currently paused. Activate camera or click demo sign chips below.
                </p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activate Side A Camera</span>
                </button>
              </div>
            )}

            {/* Quick Demo Inquiries (1-Click Presets for Rapid Testing) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">
                  Quick Sign Triggers (Click to test without camera):
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">1-Click Full Dialogue</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_INQUIRIES.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPresetInquiry(demo.tokens)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-xs text-slate-200 hover:text-white font-medium transition-all active:scale-95"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detected Signs Token Badges */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Captured Sign Tokens (1x per gesture):
                  </span>
                  {citizenTokens.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-mono border border-cyan-400/40">
                      Active Stream
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-400">
                    {citizenTokens.length} {citizenTokens.length === 1 ? 'Token' : 'Tokens'}
                  </span>
                  {citizenTokens.length > 0 && (
                    <button
                      onClick={() => {
                        setCitizenTokens([]);
                        if (onClearForwarded) onClearForwarded();
                        try { sessionStorage.removeItem('signbridge_forwarded_signs'); } catch (e) {}
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[10px] text-slate-400 hover:text-rose-300 border border-white/10 transition-colors"
                      title="Clear all sign tokens"
                    >
                      Clear Signs
                    </button>
                  )}
                </div>
              </div>
              
              {citizenTokens.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#070C18] border border-white/10 min-h-[48px]">
                  {citizenTokens.map((token, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{token}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </span>
                  ))}
                  {isSigningActive && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono animate-pulse">
                      Signing in progress...
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#070C18] border border-dashed border-white/10 text-xs text-slate-500 text-center">
                  Awaiting sign language gestures from citizen...
                </div>
              )}
            </div>

            {/* AUTOMATICALLY DETECTED CITIZEN SENTENCE CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#070C18] via-[#091124] to-[#0D1836] border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Automatically Detected Citizen Sentence:</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/20">
                  {citizenAnalysis.category}
                </span>
              </div>

              {citizenAnalysis.detectedSentence ? (
                <div className="text-xl sm:text-2xl font-black text-white tracking-wide leading-snug">
                  "{citizenAnalysis.detectedSentence}"
                </div>
              ) : (
                <div className="text-slate-500 italic text-base">
                  Sign at the camera to automatically assemble an intelligible sentence.
                </div>
              )}

              {/* Multilingual Translation when non-English is chosen */}
              {selectedLang !== 'en' && citizenAnalysis.detectedSentence && (
                <div className="pt-2.5 border-t border-white/10">
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold block mb-0.5">
                    {currentLangObj.name} Spoken Articulation:
                  </span>
                  <div className="text-lg font-bold text-cyan-200">
                    "{citizenAnalysis.spokenText}"
                  </div>
                </div>
              )}
            </div>

            {/* Side A Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakCitizenMessage}
                  disabled={!citizenAnalysis.detectedSentence}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-cyan-400/20"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 Speak Citizen Sentence</span>
                </button>

                <button
                  onClick={() => finalizeAndTriggerReply(citizenTokens)}
                  disabled={!citizenTokens.length}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Send to Side B</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndoCitizen}
                  disabled={!citizenTokens.length}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30"
                  title="Undo last sign"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>

                <button
                  onClick={handleClearCitizen}
                  disabled={!citizenTokens.length}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 disabled:opacity-30"
                  title="Clear sign tokens"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* =================================================================== */}
        {/* SIDE B: Staff Response & Automated Correct Reply (5 cols)           */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-cyan-500/20 shadow-2xl space-y-6">
            
            {/* Side B Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${isStaffSpeaking ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'}`} />
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                    SIDE B: Staff Response (Speech & Intercom)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Auto-generated verified counter reply
                  </span>
                </div>
              </div>

              {/* Auto Reply Switch */}
              <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400/40 transition-all">
                <input
                  type="checkbox"
                  checked={autoReplyEnabled}
                  onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                  className="sr-only"
                />
                <span className={`w-2.5 h-2.5 rounded-full ${autoReplyEnabled ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-300">
                  {autoReplyEnabled ? 'AUTO-REPLY: ON' : 'AUTO-REPLY: OFF'}
                </span>
              </label>
            </div>

            {/* HIGHLIGHTED CORRECT AI-MATCHED STAFF REPLY CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#061528] via-[#091C36] to-[#0A2242] border-2 border-cyan-400 shadow-2xl shadow-cyan-500/10 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-400/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Correct Verified Reply for Side A</span>
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {correctReplyData.matchConfidence}% Match
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Targeted Citizen Inquiry: {citizenAnalysis.intent.replace('_', ' ').toUpperCase()}
                </span>
                <div className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                  "{correctReplyData.replyText}"
                </div>
              </div>

              {/* Multilingual Voice Articulation for Citizen */}
              {selectedLang !== 'en' && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold block mb-0.5">
                    {currentLangObj.name} Synthesized Response:
                  </span>
                  <div className="text-sm font-semibold text-cyan-100">
                    "{correctReplyData.spokenReply}"
                  </div>
                </div>
              )}

              {/* High-Visibility Primary Voice Button */}
              <button
                onClick={() => handleSpeakStaffReply(correctReplyData.spokenReply)}
                className={`w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                  isStaffSpeaking 
                    ? 'bg-amber-400 text-black animate-pulse shadow-amber-400/30' 
                    : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-400/25'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isStaffSpeaking ? 'Broadcasting Voice Response to Citizen...' : '🔊 Speak Correct Reply to Citizen'}</span>
              </button>
            </div>

            {/* Alternative Contextual Replies */}
            {correctReplyData.alternatives && correctReplyData.alternatives.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">
                  Alternative Official Responses:
                </span>
                <div className="space-y-2">
                  {correctReplyData.alternatives.map((reply, idx) => (
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
            )}

            {/* Custom Clerk Message Textarea */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-slate-400">Custom Clerk Message:</span>
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={staffResponseText}
                  onChange={(e) => setStaffResponseText(e.target.value)}
                  placeholder="Type any customized answer to speak aloud to citizen..."
                  className="w-full p-3 rounded-xl bg-[#070C18] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
                <button
                  onClick={() => handleSpeakStaffReply()}
                  disabled={!staffResponseText.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Speak Custom Response</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Two-Way Counter Session Intercom Log */}
      <div className="p-6 rounded-3xl bg-[#0D1527]/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Live Intercom Dialogue Log (Side A & Side B)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sessionHistory.length} Exchanges Recorded
          </span>
        </div>

        <div className="space-y-3">
          {sessionHistory.slice(0, 5).map((sess, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#070C18] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-white/10 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{sess.counter}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">{sess.timestamp}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-cyan-400 font-semibold">Side A (Citizen): </span>
                  <span className="font-medium text-white">"{sess.citizen_text}"</span>
                </div>
                {sess.staff_response && (
                  <div className="text-slate-300">
                    <span className="text-emerald-400 font-semibold">Side B (Staff): </span>
                    <span className="text-slate-200">"{sess.staff_response}"</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/20">
                  {sess.confidence}% Conf
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-[11px]">
                  {sess.status || 'Resolved'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
