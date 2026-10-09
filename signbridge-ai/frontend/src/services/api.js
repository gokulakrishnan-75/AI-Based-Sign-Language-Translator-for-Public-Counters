// API Service for SIGNBRIDGE AI FastAPI Backend

const API_BASE = '/api';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  async getSigns() {
    try {
      const res = await fetch(`${API_BASE}/signs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async predictLandmarks(landmarks) {
    try {
      const rawPts = landmarks.map(p => Array.isArray(p) ? p : [p.x, p.y, p.z || 0]);
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks: rawPts })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async predictAndStabilize(landmarks) {
    try {
      const rawPts = landmarks ? landmarks.map(p => Array.isArray(p) ? p : [p.x, p.y, p.z || 0]) : null;
      const res = await fetch(`${API_BASE}/predict/stabilize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks: rawPts })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async getMetrics() {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      // Fallback to static public metrics.json if backend not running
      try {
        const staticRes = await fetch('/metrics.json');
        if (staticRes.ok) return await staticRes.json();
      } catch (err) {}
      return null;
    }
  },

  async captureSample(signId, landmarks) {
    try {
      const res = await fetch(`${API_BASE}/dataset/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign_id: signId, landmarks })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getDatasetStats() {
    try {
      const res = await fetch(`${API_BASE}/dataset/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async retrainModel() {
    try {
      const res = await fetch(`${API_BASE}/dataset/retrain`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  async getCounterHistory() {
    try {
      const res = await fetch(`${API_BASE}/counter/history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async postCounterMessage(data) {
    try {
      const res = await fetch(`${API_BASE}/counter/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
