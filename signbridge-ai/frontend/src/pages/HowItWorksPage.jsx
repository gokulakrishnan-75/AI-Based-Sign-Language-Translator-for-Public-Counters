import React from 'react';
import { 
  Camera, 
  Cpu, 
  Layers, 
  Gauge, 
  FileText, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  ArrowDown
} from 'lucide-react';

export default function HowItWorksPage({ setActivePage }) {
  const steps = [
    {
      num: "01",
      title: "Optical Capture & Camera Ingestion",
      icon: Camera,
      summary: "Browser accesses webcam stream at standard 30 FPS.",
      details: "Frames are ingested in memory directly into an HTML5 canvas element. No video footage is ever uploaded to external cloud servers, guaranteeing absolute citizen privacy."
    },
    {
      num: "02",
      title: "Real-Time 3D Hand Landmark Detection",
      icon: Cpu,
      summary: "MediaPipe Hands identifies 21 spatial joints per frame.",
      details: "Extracts key skeletal landmarks including wrist, CMC, MCP, PIP, DIP, and fingertips in 3D camera coordinates (x, y, z) with sub-10ms latency."
    },
    {
      num: "03",
      title: "Biomechanical Normalization & Invariant Extraction",
      icon: Layers,
      summary: "Coordinates normalized relative to wrist origin and palm scale.",
      details: "All 21 joint coordinates are centered on the wrist (landmark 0) and scaled by palm diameter (wrist to middle MCP). We then extract 5 finger curl ratios and 4 fingertip spread metrics, yielding a 72-dimensional feature vector completely invariant to user hand size and camera distance."
    },
    {
      num: "04",
      title: "Deep Neural Network Classifier Inference",
      icon: Gauge,
      summary: "Forward pass through Multi-Layer Deep Perceptron (MLP).",
      details: "Architecture features 3 hidden layers (128 -> 64 -> 32 units) with ReLU activations and Softmax probability distribution across the 20 public service vocabulary classes."
    },
    {
      num: "05",
      title: "Multi-Frame Prediction Stabilization & Voting",
      icon: CheckCircle2,
      summary: "Sliding-window voting and streak verification.",
      details: "Eliminates frame flickering by requiring at least 3 consecutive matching predictions across a 5-frame sliding window, with a 70% minimum calibrated confidence threshold."
    },
    {
      num: "06",
      title: "Public Service Translation & Two-Way Speech",
      icon: Volume2,
      summary: "Signs assembled into natural language and spoken aloud.",
      details: "Consecutive gestures are assembled in the Sentence Builder, formatted with counter-ready punctuation, displayed to the desk officer, and articulated aloud using browser Text-to-Speech."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
          AI Architecture & Technical Pipeline
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          How SIGNBRIDGE AI Operates
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          A step-by-step breakdown of the computer vision and deep learning pipeline from raw video capture to accessible speech synthesis.
        </p>
      </div>

      {/* 6 Step Cards Flow */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="relative">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-white/10 hover:border-cyan-500/40 transition-all shadow-xl flex flex-col sm:flex-row items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Icon className="w-8 h-8" />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      PHASE {s.num}
                    </span>
                    <span className="text-slate-600">•</span>
                    <h2 className="text-lg font-bold text-white">{s.title}</h2>
                  </div>
                  <p className="text-sm font-semibold text-cyan-200">
                    {s.summary}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.details}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center py-2 text-cyan-500/40">
                  <ArrowDown className="w-5 h-5 animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Engineering Technical Deep Dive */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0D1527] to-[#070C18] border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>72-Dimensional Invariant Feature Engineering</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard raw pixel CNNs fail in varying public counter environments due to variable lighting, clothing, and background motion. SIGNBRIDGE AI solves this with mathematically invariant biometric features:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-cyan-400 font-bold block">63 Coordinates</span>
            <span className="text-slate-400 text-[11px]">21 Landmarks (x, y, z) centered on wrist origin & divided by palm scale.</span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-emerald-400 font-bold block">5 Curl Ratios</span>
            <span className="text-slate-400 text-[11px]">Tip-to-wrist vs MCP-to-wrist distance ratios for all 5 fingers.</span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-purple-400 font-bold block">4 Spread Metrics</span>
            <span className="text-slate-400 text-[11px]">Normalized Euclidean distances between adjacent fingertips.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-center">
          <button
            onClick={() => setActivePage('translator')}
            className="px-6 py-3 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-500/30"
          >
            Test Architecture in Live Translator →
          </button>
        </div>
      </div>

    </div>
  );
}
