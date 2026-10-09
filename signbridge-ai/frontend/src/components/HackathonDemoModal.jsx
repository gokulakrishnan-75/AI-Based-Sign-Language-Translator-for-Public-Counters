import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  Sparkles, 
  Camera, 
  Hand, 
  Cpu, 
  Gauge, 
  FileText, 
  MessageSquare,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { speechService } from '../services/speech';

const DEMO_STEPS = [
  {
    step: 1,
    title: "Start Camera & Sensor Calibration",
    subtitle: "Webcam feeds are ingested locally at 30 FPS",
    icon: Camera,
    detail: "The client accesses the camera with sub-50ms latency. No video streams are saved to disk, preserving citizen privacy.",
    visual: "Camera Feed Active • 640x480 RGB Input"
  },
  {
    step: 2,
    title: "Citizen Performs Supported Gesture",
    subtitle: "Citizen performs a greeting or request (e.g., 'HELLO')",
    icon: Hand,
    detail: "The user raises their hand at a public service counter. The platform tracks hand position invariant of skin tone, lighting, or background.",
    visual: "Gesture Observed: Upright Open Palm"
  },
  {
    step: 3,
    title: "Real-Time 3D Landmark Extraction",
    subtitle: "21 Biometric joints identified via MediaPipe",
    icon: Cpu,
    detail: "Coordinates are translated relative to the wrist (landmark 0) and scaled by palm diameter to achieve absolute scale and distance invariance.",
    visual: "21 Hand Landmarks Normalized • 72 Invariant Features"
  },
  {
    step: 4,
    title: "Deep Learning Sign Prediction",
    subtitle: "Forward pass through Multi-Layer Neural Network",
    icon: Gauge,
    detail: "Deep neural classifier computes probability distribution across 20 classes using Adam-trained weights.",
    visual: "Top Prediction: HELLO • Calibrated Confidence: 94.6%"
  },
  {
    step: 5,
    title: "Multi-Frame Prediction Stabilization",
    subtitle: "Sliding-window voting & streak verification",
    icon: CheckCircle2,
    detail: "Filters out frame flicker. Requires at least 3 consecutive high-confidence frames before confirmation.",
    visual: "Streak: 4/5 Frames Confirmed • High Confidence"
  },
  {
    step: 6,
    title: "Sentence Construction & Smoothing",
    subtitle: "Translates gesture stream into natural grammar",
    icon: FileText,
    detail: "Accumulates signs into contextual public service sentences: 'HELLO I NEED HELP WHERE RESTROOM'.",
    visual: "Assembled: 'Hello, I need assistance please.'"
  },
  {
    step: 7,
    title: "Two-Way Voice Synthesis & Counter Handover",
    subtitle: "Browser Text-to-Speech communicates with clerk",
    icon: Volume2,
    detail: "The service officer hears the spoken request aloud and reads the translation on their counter terminal.",
    visual: "Audio Spoken Aloud • Handed to Public Service Clerk"
  }
];

export default function HackathonDemoModal({ isOpen, onClose, onLaunchLive }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlayingAuto && currentStep < DEMO_STEPS.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3500);
    } else if (isPlayingAuto && currentStep === DEMO_STEPS.length - 1) {
      setIsPlayingAuto(false);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAuto, currentStep]);

  if (!isOpen) return null;

  const stepData = DEMO_STEPS[currentStep];
  const StepIcon = stepData.icon;

  const handleSpeakDemo = () => {
    speechService.speak("Hello, I need assistance please. Where is the restroom located?");
    setAudioPlayed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0B132B] border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070C18]/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                HACKATHON GUIDED TOUR
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                  Step {currentStep + 1} of 7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous Sign Language Translation Pipeline for Public Service Counters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#070C18] h-1.5 flex">
          {DEMO_STEPS.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setCurrentStep(idx)}
              className={`h-full flex-1 cursor-pointer transition-all duration-300 ${
                idx <= currentStep ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Step Hero Visual Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0F1B38] to-[#0A1226] border border-cyan-500/20 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <StepIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  STAGE {stepData.step}: {stepData.title}
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {stepData.subtitle}
                </h3>
                <p className="text-sm text-slate-300 pt-1 leading-relaxed">
                  {stepData.detail}
                </p>
              </div>
            </div>

            {/* Interactive Live Stage Simulation Box */}
            <div className="mt-5 p-4 rounded-xl bg-[#070C18]/80 border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs text-cyan-300 font-medium">
                  {stepData.visual}
                </span>
              </div>
              
              {currentStep === 6 && (
                <button
                  onClick={handleSpeakDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{audioPlayed ? 'Speak Again' : 'Listen Aloud'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper Steps List Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DEMO_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`p-2 rounded-xl text-left transition-all ${
                  idx === currentStep
                    ? 'bg-cyan-500/20 border border-cyan-400/50 text-white'
                    : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] font-mono text-cyan-400 font-bold">0{s.step}</div>
                <div className="text-[11px] font-semibold truncate">{s.title.split(' ')[0]}</div>
              </button>
            ))}
          </div>

        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#070C18]/80">
          
          {/* Autoplay / Manual Toggle */}
          <button
            onClick={() => setIsPlayingAuto(!isPlayingAuto)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isPlayingAuto ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPlayingAuto ? 'animate-spin' : ''}`} />
            <span>{isPlayingAuto ? 'Pause Autoplay' : 'Autoplay Demo'}</span>
          </button>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {currentStep < DEMO_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(DEMO_STEPS.length - 1, prev + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-500/30"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  if (onLaunchLive) onLaunchLive();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-95 transition-all shadow-lg shadow-emerald-500/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Live Application</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
