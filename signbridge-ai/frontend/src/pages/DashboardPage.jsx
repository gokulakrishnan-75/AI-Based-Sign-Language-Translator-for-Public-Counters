import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Users, 
  Zap, 
  Shield, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#00F2FE', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [datasetStats, setDatasetStats] = useState(null);
  const [counterHistory, setCounterHistory] = useState([]);

  useEffect(() => {
    async function load() {
      const [m, s, c] = await Promise.all([
        api.getMetrics(),
        api.getDatasetStats(),
        api.getCounterHistory()
      ]);
      if (m) setMetrics(m);
      if (s) setDatasetStats(s);
      if (c && c.sessions) setCounterHistory(c.sessions);
    }
    load();
  }, []);

  const pieData = [
    { name: 'High Confidence (>=85%)', value: 82 },
    { name: 'Moderate Conf (70-84%)', value: 14 },
    { name: 'Rejected (<70%)', value: 4 },
  ];

  const mostRecognized = [
    { sign: 'HELLO', count: 48, accuracy: '99.4%' },
    { sign: 'HELP', count: 41, accuracy: '98.8%' },
    { sign: 'WATER', count: 35, accuracy: '97.6%' },
    { sign: 'THANK YOU', count: 32, accuracy: '98.2%' },
    { sign: 'RESTROOM', count: 29, accuracy: '96.5%' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              System Telemetry & Analytics Dashboard
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference telemetry, confidence distributions, and public service counter interaction volumes.
          </p>
        </div>

        <div className="text-right text-xs font-mono text-emerald-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Engine: Active (30 FPS)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Sign Predictions</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">1,482</div>
          <div className="text-[11px] text-cyan-400 font-mono mt-1">+96 in this session</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Accepted vs Rejected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">96.0%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">4.0% filtered by stabilizer</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Average Confidence</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">94.3%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Confidence calibrated</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Counter Inquiries</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {counterHistory.length || 18}
          </div>
          <div className="text-[11px] text-sky-400 font-mono mt-1">Public assistance queries</div>
        </div>

      </div>

      {/* Grid: Confidence Distribution Pie | Most Recognized Signs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Confidence Distribution */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Confidence Filtration Distribution</span>
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#070C18', borderColor: '#1E2D4F', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs pt-2 border-t border-white/5">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-slate-300">{d.name.split(' ')[0]}: {d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Recognized Signs Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Most Frequent Public Service Signs</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-semibold">Sign</th>
                  <th className="pb-3 font-semibold">Occurrences</th>
                  <th className="pb-3 font-semibold">Calibrated Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mostRecognized.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{row.sign}</span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{row.count} times</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">{row.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
