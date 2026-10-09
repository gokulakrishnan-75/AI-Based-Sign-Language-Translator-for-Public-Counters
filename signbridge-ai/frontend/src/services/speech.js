// Browser Text-To-Speech (TTS) & Web Audio Sound Effects Service

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.audioCtx = null;
    this.isSpeaking = false;
  }

  // Native Synthesizer Chime (Zero external assets needed)
  playChime(type = 'confirm') {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === 'confirm') {
        // High pleasant double chime (C6 -> G6)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now); // C6
        osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else if (type === 'success') {
        // Triumphant 3-note chord (E5 -> G5 -> C6)
        [659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else if (type === 'match') {
        // Soft lock-in beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio context may be restricted by user gesture policy
    }
  }

  speak(text, lang = 'en-US', onEnd = null) {
    if (!this.synth || !text) {
      console.warn("Speech synthesis unavailable or empty text.");
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Clear public service articulation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick natural voice for chosen language
    const voices = this.synth.getVoices();
    const langPrefix = lang.split('-')[0];
    const preferredVoice = voices.find(
      v => v.lang === lang || (v.lang.startsWith(langPrefix) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Microsoft')))
    ) || voices.find(v => v.lang.startsWith(langPrefix));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("TTS Error:", e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

export const speechService = new SpeechService();
