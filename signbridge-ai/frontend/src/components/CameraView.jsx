import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Scan, 
  Hand, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { analyzeMultiHands } from '../services/gestureTrigger';

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
  identifiedSign = null,
  triggerHand = 'Right', // 'Right' by default as requested!
  onTriggerHandChange = null,
  requireIndexTrigger = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const handsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const cameraRunningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const smoothedBboxesRef = useRef({});
  const lastMultiAnalysisRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showFrame, setShowFrame] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [hasHand, setHasHand] = useState(false);
  const [triggerHandMode, setTriggerHandMode] = useState(triggerHand);
  const [invertMirror, setInvertMirror] = useState(false);

  // Sync internal state if prop changes
  useEffect(() => {
    if (triggerHand) setTriggerHandMode(triggerHand);
  }, [triggerHand]);

  const triggerHandModeRef = useRef(triggerHandMode);
  useEffect(() => {
    triggerHandModeRef.current = triggerHandMode;
  }, [triggerHandMode]);

  const invertMirrorRef = useRef(invertMirror);
  useEffect(() => {
    invertMirrorRef.current = invertMirror;
  }, [invertMirror]);

  const requireIndexTriggerRef = useRef(requireIndexTrigger);
  useEffect(() => {
    requireIndexTriggerRef.current = requireIndexTrigger;
  }, [requireIndexTrigger]);

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

  // Render Overlay (Frame, Skeleton Lines, HUD Badges, Top Banner)
  const drawCanvasOverlay = useCallback((multiHands = [], multiAnalysis = null) => {
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

    const handsMeta = multiAnalysis?.handsMeta || [];

    if (handsMeta.length > 0) {
      // Draw each hand detected (Sign Hand and/or Trigger Hand)
      handsMeta.forEach((meta) => {
        const landmarks = meta.landmarks;
        if (!landmarks || landmarks.length !== 21) return;

        const handSide = meta.handSide || 'Hand';
        const isTriggerActive = meta.isEligibleTrigger && multiAnalysis?.isTriggerActive;
        const isTriggerHand = meta.isEligibleTrigger || (multiAnalysis?.triggerLandmarks === landmarks);
        const isWrongHandTrigger = meta.isIndexTrigger && !meta.isEligibleTrigger;

        // Determine hand theme color and text
        let themeColor = '#00F2FE';
        let glowColor = 'rgba(0, 242, 254, 0.7)';
        let badgeText = `${handSide.toUpperCase()} HAND`;

        if (requireIndexTriggerRef.current && isTriggerActive) {
          themeColor = '#10B981';
          glowColor = 'rgba(16, 185, 129, 0.85)';
          badgeText = `☝️ ${handSide.toUpperCase()} HAND • COMMIT TRIGGER ACTIVE`;
        } else if (requireIndexTriggerRef.current && isWrongHandTrigger) {
          themeColor = '#F43F5E';
          glowColor = 'rgba(244, 63, 94, 0.75)';
          badgeText = `${handSide.toUpperCase()} • ⚠️ USE RIGHT HAND ☝️`;
        } else if (requireIndexTriggerRef.current && isTriggerHand) {
          themeColor = '#F59E0B';
          glowColor = 'rgba(245, 158, 11, 0.7)';
          badgeText = `${handSide.toUpperCase()} HAND • READY (RAISE ☝️)`;
        } else {
          // Sign Hand
          const isHighConf = (activeConf || 0) >= 60;
          themeColor = isHighConf ? '#10B981' : '#00F2FE';
          glowColor = isHighConf ? 'rgba(16, 185, 129, 0.7)' : 'rgba(0, 242, 254, 0.7)';
          badgeText = activeSign 
            ? `${handSide.toUpperCase()} HAND • ${activeSign}${activeConf ? ` • ${Math.round(activeConf)}%` : ''}`
            : `${handSide.toUpperCase()} HAND • SIGNING`;
        }

        // 1. Calculate Bounding Box of this Hand
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        for (const p of landmarks) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }

        const padX = (maxX - minX) * 0.16 + 0.035;
        const padY = (maxY - minY) * 0.16 + 0.035;

        const rawBox = {
          x: Math.max(0, (minX - padX) * w),
          y: Math.max(0, (minY - padY) * h),
          w: Math.min(w, (maxX - minX + 2 * padX) * w),
          h: Math.min(h, (maxY - minY + 2 * padY) * h)
        };

        const handKey = `hand_${meta.index}_${handSide}`;
        if (!smoothedBboxesRef.current[handKey]) {
          smoothedBboxesRef.current[handKey] = { ...rawBox };
        } else {
          const alpha = 0.35;
          smoothedBboxesRef.current[handKey].x += (rawBox.x - smoothedBboxesRef.current[handKey].x) * alpha;
          smoothedBboxesRef.current[handKey].y += (rawBox.y - smoothedBboxesRef.current[handKey].y) * alpha;
          smoothedBboxesRef.current[handKey].w += (rawBox.w - smoothedBboxesRef.current[handKey].w) * alpha;
          smoothedBboxesRef.current[handKey].h += (rawBox.h - smoothedBboxesRef.current[handKey].h) * alpha;
        }

        const box = smoothedBboxesRef.current[handKey];

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
          ctx.fillStyle = isTriggerActive ? 'rgba(16, 185, 129, 0.12)' : (isWrongHandTrigger ? 'rgba(244, 63, 94, 0.1)' : 'rgba(0, 242, 254, 0.08)');
          ctx.fill();

          // Finger bone lines
          ctx.lineWidth = 3.0;
          for (const group of FINGER_GROUPS) {
            ctx.strokeStyle = isTriggerActive ? '#10B981' : (isWrongHandTrigger ? '#F43F5E' : group.color);
            ctx.shadowColor = ctx.strokeStyle;
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
          ctx.strokeStyle = themeColor;
          ctx.shadowColor = themeColor;
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
            const isIndexTip = (i === 8);

            if (isWrist) {
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
            } else if (isIndexTip && isTriggerActive) {
              // Extra prominent glowing beacon on index fingertip when trigger is active!
              ctx.beginPath();
              ctx.arc(px, py, 9, 0, 2 * Math.PI);
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowBlur = 18;
              ctx.shadowColor = '#10B981';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(px, py, 14, 0, 2 * Math.PI);
              ctx.lineWidth = 2.5;
              ctx.strokeStyle = '#10B981';
              ctx.stroke();
            } else if (isTip) {
              ctx.beginPath();
              ctx.arc(px, py, 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowBlur = 12;
              ctx.shadowColor = themeColor;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(px, py, 8.5, 0, 2 * Math.PI);
              ctx.lineWidth = 1.6;
              ctx.strokeStyle = glowColor;
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
              ctx.fillStyle = themeColor;
              ctx.shadowBlur = 5;
              ctx.shadowColor = themeColor;
              ctx.fill();
            }
          }
        }

        // ----------------------------------------------------
        // DRAW DYNAMIC AI HAND TARGETING FRAME
        // ----------------------------------------------------
        if (drawFrame) {
          ctx.fillStyle = isTriggerActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 242, 254, 0.05)';
          ctx.fillRect(box.x, box.y, box.w, box.h);

          // Frame perimeter line
          ctx.lineWidth = isTriggerActive ? 2.2 : 1.6;
          ctx.strokeStyle = themeColor;
          ctx.shadowColor = themeColor;
          ctx.shadowBlur = isTriggerActive ? 14 : 10;
          ctx.strokeRect(box.x, box.y, box.w, box.h);

          // Corner Reticle Brackets
          const cornerLen = Math.min(26, box.w * 0.22, box.h * 0.22);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = themeColor;

          // Top-Left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLen);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLen, box.y);
          ctx.stroke();

          // Top-Right
          ctx.beginPath();
          ctx.moveTo(box.x + box.w - cornerLen, box.y);
          ctx.lineTo(box.x + box.w, box.y);
          ctx.lineTo(box.x + box.w, box.y + cornerLen);
          ctx.stroke();

          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + box.h - cornerLen);
          ctx.lineTo(box.x, box.y + box.h);
          ctx.lineTo(box.x + cornerLen, box.y + box.h);
          ctx.stroke();

          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(box.x + box.w - cornerLen, box.y + box.h);
          ctx.lineTo(box.x + box.w, box.y + box.h);
          ctx.lineTo(box.x + box.w, box.y + box.h - cornerLen);
          ctx.stroke();

          // Attached HUD Badge Pill (Above Frame)
          const badgeX = box.x + box.w / 2;
          const badgeY = Math.max(22, box.y - 14);

          ctx.save();
          ctx.font = 'bold 11px Inter, sans-serif';
          const textWidth = ctx.measureText(badgeText).width;
          const pillW = textWidth + 24;
          const pillH = 22;
          const pillX = badgeX - pillW / 2;
          const pillY = badgeY - pillH / 2;

          // Glass Pill Background
          ctx.fillStyle = 'rgba(7, 12, 24, 0.94)';
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
          ctx.scale(-1, 1);
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 11px Inter, monospace';
          ctx.shadowBlur = 0;
          ctx.fillText(badgeText, 0, 1);
          ctx.restore();

          ctx.restore();
        }
      });

      // ----------------------------------------------------
      // TOP CENTER PROMINENT HUD BANNER
      // ----------------------------------------------------
      if (requireIndexTriggerRef.current && multiAnalysis?.isTriggerActive) {
        ctx.save();
        ctx.translate(w / 2, 30);
        ctx.scale(-1, 1); // Un-mirror for readable text
        ctx.fillStyle = 'rgba(16, 185, 129, 0.96)';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 16;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(-155, -14, 310, 28, 8);
          ctx.fill();
        } else {
          ctx.fillRect(-155, -14, 310, 28);
        }
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(`☝️ RIGHT HAND TRIGGER ACTIVE: COMMITTING SIGN`, 0, 1);
        ctx.restore();
      } else if (requireIndexTriggerRef.current && handsMeta.some(h => h.isIndexTrigger && !h.isEligibleTrigger)) {
        // Warning banner when index finger shown on Left hand while Right hand is required
        ctx.save();
        ctx.translate(w / 2, 30);
        ctx.scale(-1, 1);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.94)';
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 14;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(-170, -14, 340, 28, 8);
          ctx.fill();
        } else {
          ctx.fillRect(-170, -14, 340, 28);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(`⚠️ LEFT HAND INDEX DETECTED • SHOW RIGHT HAND INDEX (☝️)`, 0, 1);
        ctx.restore();
      }

    } else {
      // ----------------------------------------------------
      // DRAW ALIGNMENT GUIDE FRAME (When awaiting hand entry)
      // ----------------------------------------------------
      smoothedBboxesRef.current = {};

      if (drawGuide) {
        const gw = Math.min(270, w * 0.55);
        const gh = Math.min(340, h * 0.72);
        const gx = (w - gw) / 2;
        const gy = (h - gh) / 2;

        ctx.save();

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(gx, gy, gw, gh);

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

        drawHandSilhouette(ctx, gx + gw / 2, gy + gh / 2 - 10);

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

  // Handle MediaPipe Detection Results (Separates Sign Hand from Right-Hand Index Trigger)
  const handleResultsRef = useRef(null);
  handleResultsRef.current = (results) => {
    const multiHands = results.multiHandLandmarks || [];
    const multiHandedness = results.multiHandedness || [];

    if (multiHands.length > 0) {
      setHasHand(true);

      const multiAnalysis = analyzeMultiHands(multiHands, multiHandedness, {
        requiredTriggerHand: triggerHandModeRef.current,
        invertMirror: invertMirrorRef.current,
        requireIndexTrigger: requireIndexTriggerRef.current
      });
      lastMultiAnalysisRef.current = multiAnalysis;

      // CRITICAL: landmarksToPredict MUST BE signLandmarks!
      // If signLandmarks is null (e.g. only index finger trigger is shown),
      // NEVER feed the trigger hand to the sign classifier!
      const landmarksToPredict = multiAnalysis.signLandmarks || null;

      if (onLandmarksDetectedRef.current) {
        onLandmarksDetectedRef.current(landmarksToPredict, multiAnalysis);
      }

      drawCanvasOverlay(multiHands, multiAnalysis);
    } else {
      setHasHand(false);
      lastMultiAnalysisRef.current = null;
      if (onLandmarksDetectedRef.current) {
        onLandmarksDetectedRef.current(null, { isTriggerActive: false, handsCount: 0, handsMeta: [] });
      }
      drawCanvasOverlay([], null);
    }
  };

  // MediaPipe Hands Initialization (Mount Once)
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

          // Set maxNumHands: 2 to simultaneously track Sign Hand and Right Hand Commit Trigger
          handsInstance.setOptions({
            maxNumHands: 2,
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
          console.log('[CameraView] MediaPipe Hands initialized with Multi-Hand Right-Trigger tracking.');
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
            console.debug('[CameraView] Frame send error:', err);
          })
          .finally(() => {
            isProcessingRef.current = false;
          });
      }
    }

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
        
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('[CameraView] Video play error:', e);
        }

        streamRef.current = stream;
        cameraRunningRef.current = true;
        setCameraActive(true);

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
    smoothedBboxesRef.current = {};
    lastMultiAnalysisRef.current = null;
    if (onLandmarksDetectedRef.current) onLandmarksDetectedRef.current(null);
  };

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

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
            {cameraActive ? (hasHand ? 'HANDS TRACKED (21 LANDMARKS)' : 'SEARCHING HANDS') : 'CAMERA OFF'}
          </span>
          {hasHand && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ☝️ RIGHT TRIGGER: {triggerHandMode === 'Right' ? 'ACTIVE' : triggerHandMode.toUpperCase()}
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
        
        {/* Visual Frame & Lines & Trigger Mode Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
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

          {/* Trigger Hand Selector: Defaults to Right Hand ☝️ */}
          <button
            onClick={() => {
              const nextMode = triggerHandMode === 'Right' ? 'Left' : (triggerHandMode === 'Left' ? 'Any' : 'Right');
              setTriggerHandMode(nextMode);
              if (onTriggerHandChange) onTriggerHandChange(nextMode);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-sm ${
              triggerHandMode === 'Right'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}
            title="Switch which hand's index finger triggers word commit"
          >
            <span>☝️ Trigger: {triggerHandMode === 'Right' ? 'Right Hand' : (triggerHandMode === 'Left' ? 'Left Hand' : 'Any Hand')}</span>
          </button>

          {/* Invert Mirror Toggle (In case user's camera driver is inverted) */}
          <button
            onClick={() => setInvertMirror(!invertMirror)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all shadow-sm ${
              invertMirror 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-black/60 text-slate-400 border border-white/10 hover:text-white'
            }`}
            title="Toggle hand side inversion if camera driver is mirrored"
          >
            <span>{invertMirror ? '🪞 Hands: Inverted' : '🪞 Hands: Normal'}</span>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Enable Camera</span>
          </button>
        </div>
      )}

    </div>
  );
}
