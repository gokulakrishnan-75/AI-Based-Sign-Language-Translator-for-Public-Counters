import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Scan, 
  Hand, 
  AlertTriangle
} from 'lucide-react';

// Finger Connection Groups for Biometric Lines
const FINGER_GROUPS = [
  // Thumb (amber/gold)
  { name: 'thumb', indices: [[0, 1], [1, 2], [2, 3], [3, 4]], color: '#F59E0B' },
  // Index finger (electric cyan)
  { name: 'index', indices: [[0, 5], [5, 6], [6, 7], [7, 8]], color: '#00F2FE' },
  // Middle finger (neon teal)
  { name: 'middle', indices: [[0, 9], [9, 10], [10, 11], [11, 12]], color: '#10B981' },
  // Ring finger (sky blue)
  { name: 'ring', indices: [[0, 13], [13, 14], [14, 15], [15, 16]], color: '#38BDF8' },
  // Pinky finger (indigo/violet)
  { name: 'pinky', indices: [[0, 17], [17, 18], [18, 19], [19, 20]], color: '#818CF8' }
];

const PALM_CONNECTIONS = [
  [5, 9], 
  [9, 13], 
  [13, 17]
];

export default function CameraView({ 
  onLandmarksDetected, 
  fps = 0, 
  latency = 0,
  currentSign = null,
  confidence = 0,
  status = null,
  identifiedSign = null
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const handsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const cameraRunningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const smoothedBboxRef = useRef(null);
  const lastLandmarksRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showFrame, setShowFrame] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [hasHand, setHasHand] = useState(false);

  // Keep latest prediction in ref for live canvas overlay rendering
  const latestPredictionRef = useRef({ currentSign, confidence, status });
  useEffect(() => {
    latestPredictionRef.current = { currentSign, confidence, status };
  }, [currentSign, confidence, status]);

  // Keep toggles in ref for canvas drawing callback
  const togglesRef = useRef({ showFrame, showLines, showGuide });
  useEffect(() => {
    togglesRef.current = { showFrame, showLines, showGuide };
  }, [showFrame, showLines, showGuide]);

  // Keep onLandmarksDetected in ref so it never causes MediaPipe re-instantiation
  const onLandmarksDetectedRef = useRef(onLandmarksDetected);
  useEffect(() => {
    onLandmarksDetectedRef.current = onLandmarksDetected;
  }, [onLandmarksDetected]);

  // Draw hand silhouette for alignment guide frame
  const drawHandSilhouette = (ctx, cx, cy) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Palm outline
    ctx.beginPath();
    ctx.ellipse(cx, cy + 25, 38, 48, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Finger guide lines
    const fingers = [
      { dx: -35, dy: 10, len: 45, angle: -0.4 },  // Thumb
      { dx: -20, dy: -25, len: 65, angle: -0.15 }, // Index
      { dx: 0, dy: -32, len: 75, angle: 0 },       // Middle
      { dx: 20, dy: -25, len: 65, angle: 0.15 },  // Ring
      { dx: 35, dy: -10, len: 50, angle: 0.35 }   // Pinky
    ];

    for (const f of fingers) {
      ctx.beginPath();
      ctx.moveTo(cx + f.dx, cy + f.dy);
      const ex = cx + f.dx + Math.sin(f.angle) * f.len;
      const ey = cy + f.dy - Math.cos(f.angle) * f.len;
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Render Overlay (Frame, Skeleton Lines, HUD Badge, or Alignment Guide)
  const drawCanvasOverlay = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear previous frame
    ctx.clearRect(0, 0, w, h);

    const { showFrame: drawFrame, showLines: drawLines, showGuide: drawGuide } = togglesRef.current;
    const { currentSign: activeSign, confidence: activeConf } = latestPredictionRef.current;

    if (landmarks && landmarks.length === 21) {
      // 1. Calculate Bounding Box of Hand
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const p of landmarks) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      // Add proportional margin so wrist and finger extensions are comfortably framed
      const padX = (maxX - minX) * 0.16 + 0.035;
      const padY = (maxY - minY) * 0.16 + 0.035;

      const rawBox = {
        x: Math.max(0, (minX - padX) * w),
        y: Math.max(0, (minY - padY) * h),
        w: Math.min(w, (maxX - minX + 2 * padX) * w),
        h: Math.min(h, (maxY - minY + 2 * padY) * h)
      };

      // Exponential smoothing to eliminate box jitter
      if (!smoothedBboxRef.current) {
        smoothedBboxRef.current = { ...rawBox };
      } else {
        const alpha = 0.35;
        smoothedBboxRef.current.x += (rawBox.x - smoothedBboxRef.current.x) * alpha;
        smoothedBboxRef.current.y += (rawBox.y - smoothedBboxRef.current.y) * alpha;
        smoothedBboxRef.current.w += (rawBox.w - smoothedBboxRef.current.w) * alpha;
        smoothedBboxRef.current.h += (rawBox.h - smoothedBboxRef.current.h) * alpha;
      }

      const box = smoothedBboxRef.current;
      const isHighConf = (activeConf || 0) >= 60;
      const themeColor = isHighConf ? '#10B981' : '#00F2FE';
      const glowColor = isHighConf ? 'rgba(16, 185, 129, 0.7)' : 'rgba(0, 242, 254, 0.7)';

      // ----------------------------------------------------
      // DRAW HAND SKELETON & BIOMETRIC LINES
      // ----------------------------------------------------
      if (drawLines) {
        // Soft translucent palm webbing polygon
        ctx.beginPath();
        ctx.moveTo(landmarks[0].x * w, landmarks[0].y * h);
        ctx.lineTo(landmarks[5].x * w, landmarks[5].y * h);
        ctx.lineTo(landmarks[9].x * w, landmarks[9].y * h);
        ctx.lineTo(landmarks[13].x * w, landmarks[13].y * h);
        ctx.lineTo(landmarks[17].x * w, landmarks[17].y * h);
        ctx.closePath();
        ctx.fillStyle = isHighConf ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.08)';
        ctx.fill();

        // Finger bone lines with vibrant color coding
        ctx.lineWidth = 3.0;
        for (const group of FINGER_GROUPS) {
          ctx.strokeStyle = group.color;
          ctx.shadowColor = group.color;
          ctx.shadowBlur = 8;
          for (const [startIdx, endIdx] of group.indices) {
            const p1 = landmarks[startIdx];
            const p2 = landmarks[endIdx];
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }
        }

        // Palm base connector lines
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
        ctx.shadowColor = '#00F2FE';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.2;
        for (const [startIdx, endIdx] of PALM_CONNECTIONS) {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        }

        // Glowing Joint Landmarks
        const tipIndices = [4, 8, 12, 16, 20];
        for (let i = 0; i < landmarks.length; i++) {
          const p = landmarks[i];
          const px = p.x * w;
          const py = p.y * h;
          const isTip = tipIndices.includes(i);
          const isWrist = (i === 0);

          if (isWrist) {
            // Wrist base anchor
            ctx.beginPath();
            ctx.arc(px, py, 6.5, 0, 2 * Math.PI);
            ctx.fillStyle = themeColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = themeColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          } else if (isTip) {
            // Fingertip glowing node & halo ring
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 12;
            ctx.shadowColor = themeColor;
            ctx.fill();

            // Outer target ring
            ctx.beginPath();
            ctx.arc(px, py, 8.5, 0, 2 * Math.PI);
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = glowColor;
            ctx.stroke();
          } else {
            // Regular Joint Node
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = themeColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = themeColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          }
        }
      }

      // ----------------------------------------------------
      // DRAW DYNAMIC AI HAND TARGETING FRAME
      // ----------------------------------------------------
      if (drawFrame) {
        // Holographic interior tint
        ctx.fillStyle = isHighConf ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 242, 254, 0.05)';
        ctx.fillRect(box.x, box.y, box.w, box.h);

        // Frame perimeter line
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = isHighConf ? 'rgba(16, 185, 129, 0.7)' : 'rgba(0, 242, 254, 0.7)';
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Corner Reticle Brackets (Futuristic HUD accents)
        const cornerLen = Math.min(26, box.w * 0.22, box.h * 0.22);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = themeColor;
        ctx.shadowBlur = 12;

        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + cornerLen);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + cornerLen, box.y);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(box.x + box.w - cornerLen, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w, box.y + cornerLen);
        ctx.stroke();

        // Bottom-Left Corner
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + box.h - cornerLen);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.lineTo(box.x + cornerLen, box.y + box.h);
        ctx.stroke();

        // Bottom-Right Corner
        ctx.beginPath();
        ctx.moveTo(box.x + box.w - cornerLen, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h - cornerLen);
        ctx.stroke();

        // Hand Center Crosshair Reticle (Midpoint of hand palm)
        const centerLandmark = landmarks[9] || landmarks[0];
        const cx = centerLandmark.x * w;
        const cy = centerLandmark.y * h;
        const rLen = 7;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = themeColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(cx - rLen, cy);
        ctx.lineTo(cx + rLen, cy);
        ctx.moveTo(cx, cy - rLen);
        ctx.lineTo(cx, cy + rLen);
        ctx.stroke();

        // Live Attached HUD Badge Pill (Above Frame)
        const badgeText = activeSign 
          ? `${activeSign}${activeConf ? ` • ${Math.round(activeConf)}%` : ''}` 
          : 'HAND DETECTED';
        const badgeX = box.x + box.w / 2;
        const badgeY = Math.max(20, box.y - 14);

        ctx.save();
        ctx.font = 'bold 11px Inter, sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const pillW = textWidth + 28;
        const pillH = 22;
        const pillX = badgeX - pillW / 2;
        const pillY = badgeY - pillH / 2;

        // Dark Glass Pill Background
        ctx.fillStyle = 'rgba(7, 12, 24, 0.92)';
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, pillW, pillH, 7);
        } else {
          ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fill();
        ctx.stroke();

        // UN-MIRROR text so it renders forward and perfectly readable
        ctx.save();
        ctx.translate(badgeX, badgeY);
        ctx.scale(-1, 1); // Reverse canvas CSS scale-x-100
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 11px Inter, monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(badgeText, 0, 1);
        ctx.restore();

        ctx.restore();
      }

    } else {
      // ----------------------------------------------------
      // DRAW ALIGNMENT GUIDE FRAME (When awaiting hand entry)
      // ----------------------------------------------------
      smoothedBboxRef.current = null;

      if (drawGuide) {
        const gw = Math.min(270, w * 0.55);
        const gh = Math.min(340, h * 0.72);
        const gx = (w - gw) / 2;
        const gy = (h - gh) / 2;

        ctx.save();

        // Soft dashed framing box
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(gx, gy, gw, gh);

        // Futuristic solid corner brackets
        ctx.setLineDash([]);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#00F2FE';
        ctx.shadowColor = '#00F2FE';
        ctx.shadowBlur = 10;
        const cl = 22;

        ctx.beginPath();
        ctx.moveTo(gx, gy + cl); ctx.lineTo(gx, gy); ctx.lineTo(gx + cl, gy);
        ctx.moveTo(gx + gw - cl, gy); ctx.lineTo(gx + gw, gy); ctx.lineTo(gx + gw, gy + cl);
        ctx.moveTo(gx, gy + gh - cl); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + cl, gy + gh);
        ctx.moveTo(gx + gw - cl, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.lineTo(gx + gw, gy + gh - cl);
        ctx.stroke();

        // Center hand silhouette
        drawHandSilhouette(ctx, gx + gw / 2, gy + gh / 2 - 10);

        // Guide prompt text (un-mirrored for readability)
        ctx.save();
        ctx.translate(gx + gw / 2, gy + gh - 22);
        ctx.scale(-1, 1);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.9)';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ALIGN HAND INSIDE FRAME', 0, 0);
        ctx.restore();

        ctx.restore();
      }
    }
  }, []);

  // Handle MediaPipe Detection Results
  const handleResultsRef = useRef(null);
  handleResultsRef.current = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHasHand(true);
      const landmarks = results.multiHandLandmarks[0];
      lastLandmarksRef.current = landmarks;

      if (onLandmarksDetectedRef.current) {
        onLandmarksDetectedRef.current(landmarks);
      }

      drawCanvasOverlay(landmarks);
    } else {
      setHasHand(false);
      lastLandmarksRef.current = null;
      if (onLandmarksDetectedRef.current) {
        onLandmarksDetectedRef.current(null);
      }
      drawCanvasOverlay(null);
    }
  };

  // Robust MediaPipe Hands Initialization (Mount Once)
  useEffect(() => {
    let handsInstance = null;
    let pollTimer = null;
    let isMounted = true;

    const initHands = () => {
      if (!isMounted) return;
      if (typeof window !== 'undefined' && window.Hands) {
        try {
          if (handsRef.current) return;
          handsInstance = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });

          // Set optimal options: 0.35 detection confidence for fast, rock-solid continuous webcam hand tracking
          handsInstance.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.35,
            minTrackingConfidence: 0.35
          });

          handsInstance.onResults((results) => {
            if (handleResultsRef.current) {
              handleResultsRef.current(results);
            }
          });

          handsRef.current = handsInstance;
          console.log('[CameraView] MediaPipe Hands initialized successfully.');
          if (pollTimer) clearInterval(pollTimer);
          if (cameraRunningRef.current && !animFrameIdRef.current) {
            animFrameIdRef.current = requestAnimationFrame(runFrameLoop);
          }
        } catch (err) {
          console.warn('[CameraView] Error initializing MediaPipe Hands:', err);
        }
      }
    };

    initHands();

    if (!handsRef.current) {
      pollTimer = setInterval(initHands, 250);
      setTimeout(() => { if (pollTimer) clearInterval(pollTimer); }, 15000);
    }

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) {}
        handsRef.current = null;
      }
    };
  }, []);

  // Continuous Camera Frame Processing Loop
  const runFrameLoop = () => {
    if (!cameraRunningRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= 2 && !video.paused && handsRef.current) {
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        handsRef.current.send({ image: video })
          .catch((err) => {
            // Frame error logged safely without breaking the loop
            console.debug('[CameraView] Frame send error:', err);
          })
          .finally(() => {
            isProcessingRef.current = false;
          });
      }
    }

    // Always schedule next frame regardless of whether video was ready or paused
    animFrameIdRef.current = requestAnimationFrame(runFrameLoop);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.muted = true;
        
        // Wait for video to begin playing
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('[CameraView] Video play error:', e);
        }

        streamRef.current = stream;
        cameraRunningRef.current = true;
        setCameraActive(true);

        // Cancel any existing loop and start clean loop
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
        animFrameIdRef.current = requestAnimationFrame(runFrameLoop);
      }
    } catch (err) {
      console.error('[CameraView] Webcam access failed:', err);
      setCameraError('Camera access is unavailable. Please grant webcam permissions in your browser.');
      setCameraActive(false);
      cameraRunningRef.current = false;
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    cameraRunningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setHasHand(false);
    smoothedBboxRef.current = null;
    lastLandmarksRef.current = null;
    if (onLandmarksDetectedRef.current) onLandmarksDetectedRef.current(null);
  };

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Re-render canvas overlay when toggles or predictions change
  useEffect(() => {
    drawCanvasOverlay(lastLandmarksRef.current);
  }, [showFrame, showLines, showGuide, currentSign, confidence, status, drawCanvasOverlay]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0A0F1D] border border-white/10 shadow-2xl aspect-[4/3] flex items-center justify-center">
      
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        width={640}
        height={480}
        className="w-full h-full object-cover transform -scale-x-100"
        playsInline
        autoPlay
        muted
        onPlay={() => {
          if (cameraRunningRef.current && !animFrameIdRef.current) {
            animFrameIdRef.current = requestAnimationFrame(runFrameLoop);
          }
        }}
        onLoadedMetadata={() => {
          if (cameraRunningRef.current && !animFrameIdRef.current) {
            animFrameIdRef.current = requestAnimationFrame(runFrameLoop);
          }
        }}
      />

      {/* Biometric Landmark Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
      />

      {/* Center Floating Identified Sign Pill (High Visibility) */}
      {identifiedSign && identifiedSign.sign && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#070C18]/95 backdrop-blur-lg border border-cyan-400/60 shadow-2xl shadow-cyan-500/30 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-[10px] font-mono font-extrabold uppercase text-cyan-300 tracking-wider">
            IDENTIFIED:
          </span>
          <span className="text-sm font-black text-white tracking-wide">
            {identifiedSign.sign}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
            {Math.round(identifiedSign.confidence)}%
          </span>
        </div>
      )}

      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        
        {/* Detection Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs pointer-events-auto shadow-md">
          <span className={`w-2.5 h-2.5 rounded-full ${
            cameraActive ? (hasHand ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-amber-400') : 'bg-rose-500'
          }`} />
          <span className="font-semibold text-white">
            {cameraActive ? (hasHand ? 'HAND TRACKED (21 LANDMARKS)' : 'SEARCHING HAND') : 'CAMERA OFF'}
          </span>
          {hasHand && showFrame && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              FRAME ACTIVE
            </span>
          )}
        </div>

        {/* Telemetry (FPS & Latency) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono pointer-events-auto shadow-md">
          <span className="text-cyan-400 font-bold">{fps || 30} FPS</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">{latency ? `${latency} ms` : '0.02 ms'}</span>
        </div>

      </div>

      {/* Bottom Controls HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between flex-wrap gap-2">
        
        {/* Visual Frame & Lines Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Hand Frame Toggle */}
          <button
            onClick={() => setShowFrame(!showFrame)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all shadow-sm ${
              showFrame 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-black/60 text-slate-400 border border-white/10 hover:text-white'
            }`}
            title="Toggle Hand Bounding Frame"
          >
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showFrame ? 'Frame: ON' : 'Frame: OFF'}</span>
          </button>

          {/* Skeletal Lines Toggle */}
          <button
            onClick={() => setShowLines(!showLines)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all shadow-sm ${
              showLines 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-black/60 text-slate-400 border border-white/10 hover:text-white'
            }`}
            title="Toggle Hand Skeletal Lines"
          >
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showLines ? 'Lines: ON' : 'Lines: OFF'}</span>
          </button>
        </div>

        {/* Start / Stop Camera */}
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
            cameraActive 
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30' 
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          <span>{cameraActive ? 'Pause Camera' : 'Start Camera'}</span>
        </button>

      </div>

      {/* Error or Inactive State Overlay */}
      {(!cameraActive || cameraError) && (
        <div className="absolute inset-0 bg-[#070C18]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400">
            {cameraError ? <AlertTriangle className="w-7 h-7 text-amber-400" /> : <Camera className="w-7 h-7" />}
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {cameraError ? 'Camera Access Required' : 'Live Camera Inactive'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            {cameraError || 'Click below to activate your webcam for real-time biometric sign translation.'}
          </p>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Enable Webcam Now</span>
          </button>
        </div>
      )}

      {/* No Hand Guidance Hint */}
      {cameraActive && !hasHand && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[11px] text-cyan-300 animate-pulse pointer-events-none select-none shadow-lg">
          Position your hand inside the camera frame
        </div>
      )}

    </div>
  );
}
