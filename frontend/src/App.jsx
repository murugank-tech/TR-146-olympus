import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Search, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  Zap,
  Eye,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie
} from 'recharts';

const API_BASE = 'http://localhost:8000';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jds, setJds] = useState([]);
  const [selectedJd, setSelectedJd] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [fairnessReport, setFairnessReport] = useState([]);
  const [loading, setLoading] = useState(false);

  // JD Audit Form
  const [jdTitle, setJdTitle] = useState('');
  const [jdDescription, setJdDescription] = useState('');
  const [auditResult, setAuditResult] = useState(null);

  // Resume Upload Form
  const [resumeFile, setResumeFile] = useState(null);
  const [demographicGroup, setDemographicGroup] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchRankings = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/rankings/${id}`);
      setRankings(res.data);
      const fairRes = await axios.get(`${API_BASE}/fairness-report/${id}`);
      setFairnessReport(fairRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuditJD = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', jdTitle);
    formData.append('description', jdDescription);
    try {
      const res = await axios.post(`${API_BASE}/audit-jd`, formData);
      setAuditResult(res.data);
      setSelectedJd(res.data);
      fetchRankings(res.data.id);
      setJdTitle('');
      setJdDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile || !selectedJd) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('demographic_group', demographicGroup);
    try {
      const uploadRes = await axios.post(`${API_BASE}/upload-resume`, formData);
      setUploadStatus('success');
      await axios.post(`${API_BASE}/evaluate?candidate_id=${uploadRes.data.candidate_id}&job_id=${selectedJd.id}`);
      fetchRankings(selectedJd.id);
      setResumeFile(null);
      setDemographicGroup('');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-zinc-100">
      {/* Enhanced Sidebar */}
      <nav className="w-72 border-r border-white/10 backdrop-blur-sm bg-slate-900/40 p-6 flex flex-col gap-6 fixed h-screen left-0 top-0 overflow-y-auto">
        {/* Logo & Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-2"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">EquiHire</span>
            <span className="text-xs text-zinc-500 font-medium">Bias-Free Hiring</span>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div 
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'post', label: 'Audit Job', icon: FileText },
            { id: 'candidates', label: 'Candidates', icon: Users }
          ].map((nav) => {
            const Icon = nav.icon;
            return (
              <motion.button
                key={nav.id}
                variants={itemVariants}
                onClick={() => setActiveTab(nav.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === nav.id
                    ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white border border-blue-500/50'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {activeTab === nav.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 40 }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="font-medium relative z-10 flex-1 text-left">{nav.label}</span>
                {activeTab === nav.id && <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full relative z-10" />}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-auto p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-all"
        >
          <p className="text-xs text-zinc-400 mb-3 uppercase font-semibold tracking-wider">System Status</p>
          <div className="flex items-center gap-2 text-green-400">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-sm font-semibold">Engine Active</span>
          </div>
          <p className="text-xs text-green-400/70 mt-2">Ready to detect bias</p>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-end"
              >
                <div>
                  <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Fairness Dashboard</h1>
                  <p className="text-zinc-400 text-lg">Monitor algorithmic fairness and candidate selection metrics</p>
                </div>
                {selectedJd && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl text-sm backdrop-blur-sm"
                  >
                    <p className="text-zinc-400">Active Role</p>
                    <p className="text-white font-bold text-lg">{selectedJd.title}</p>
                  </motion.div>
                )}
              </motion.div>

              {!selectedJd ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Empty State with CTAs */}
                  <div className="lg:col-span-2 premium-card text-center py-20">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <BrainCircuit className="mx-auto text-blue-400/50 mb-6" size={80} />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-4">No Active Job Description</h2>
                    <p className="text-zinc-400 mb-8 max-w-sm mx-auto text-lg">Upload your first job description to start detecting bias and evaluating candidates fairly.</p>
                    <motion.button 
                      onClick={() => setActiveTab('post')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary mx-auto text-lg px-8 py-3"
                    >
                      <Zap size={20} />
                      Audit Job Description
                    </motion.button>
                  </div>

                  {/* Info Cards */}
                  <motion.div variants={itemVariants} className="premium-card flex flex-col items-center justify-center text-center p-8">
                    <FileText className="text-blue-400 mb-4" size={40} />
                    <h3 className="font-bold mb-2">Step 1</h3>
                    <p className="text-sm text-zinc-400">Audit a job description</p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="premium-card flex flex-col items-center justify-center text-center p-8">
                    <Users className="text-cyan-400 mb-4" size={40} />
                    <h3 className="font-bold mb-2">Step 2</h3>
                    <p className="text-sm text-zinc-400">Upload candidate resumes</p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="premium-card flex flex-col items-center justify-center text-center p-8">
                    <CheckCircle2 className="text-emerald-400 mb-4" size={40} />
                    <h3 className="font-bold mb-2">Step 3</h3>
                    <p className="text-sm text-zinc-400">Get fair evaluations</p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                >
                  {/* Stat Cards */}
                  {[
                    { label: 'Total Applicants', value: rankings.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Avg Match Score', value: rankings.length ? Math.round(rankings.reduce((a, b) => a + b.final_score, 0) / rankings.length) + '%' : '0%', icon: TrendingUp, color: 'from-emerald-500 to-cyan-500' },
                    { label: 'Fair Evaluations', value: rankings.length, icon: CheckSquare, color: 'from-pink-500 to-rose-500' },
                    { label: 'Bias Flags', value: auditResult?.bias_flags?.flags?.length || 0, icon: AlertCircle, color: 'from-amber-500 to-orange-500' }
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div 
                        key={i}
                        variants={itemVariants}
                        className="premium-card p-6 border border-white/10 hover:border-white/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-zinc-400 text-sm mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                          </div>
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                            <Icon size={24} className="text-white" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Rankings Table */}
                  <motion.div variants={itemVariants} className="lg:col-span-3 premium-card">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Top Candidate Rankings</h3>
                        <p className="text-sm text-zinc-500">Ranked by fair skill-based matching</p>
                      </div>
                      <Filter className="text-zinc-500 cursor-pointer hover:text-white" size={20} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-zinc-500 text-sm font-semibold">
                            <th className="pb-4 pl-0">Rank</th>
                            <th className="pb-4">Candidate</th>
                            <th className="pb-4">Skill Score</th>
                            <th className="pb-4">Match Quality</th>
                            <th className="pb-4 text-right pr-0">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((ev, i) => (
                            <motion.tr 
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                            >
                              <td className="py-4 pl-0">
                                <motion.span 
                                  className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-sm"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  {i + 1}
                                </motion.span>
                              </td>
                              <td className="py-4 font-mono text-sm text-cyan-400">ID-{ev.candidate_id}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${ev.final_score}%` }}
                                      transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold min-w-12 text-right">{Math.round(ev.final_score)}%</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <motion.span 
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    ev.final_score >= 70
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : ev.final_score >= 50
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  {ev.final_score >= 70 ? '✓ High' : ev.final_score >= 50 ? '~ Medium' : '✗ Low'}
                                </motion.span>
                              </td>
                              <td className="py-4 text-right pr-0">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-cyan-400 transition-all"
                                >
                                  <Eye size={18} />
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Fairness Score Chart */}
                  <motion.div variants={itemVariants} className="lg:col-span-1 premium-card">
                    <h3 className="text-lg font-bold mb-6">Disparate Impact Analysis</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fairnessReport}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="group" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          />
                          <Bar dataKey="dir" radius={[6, 6, 0, 0]}>
                            {fairnessReport.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.bias_flag ? '#ef4444' : '#06b6d4'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'post' && (
            <motion.div 
              key="post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Job Description Audit</h1>
                <p className="text-zinc-400 text-lg">Detect and remove biased language to attract a diverse talent pool</p>
              </motion.div>

              <motion.form 
                onSubmit={handleAuditJD }
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="premium-card space-y-6"
              >
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-white">Job Title</label>
                  <input 
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    required
                    className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 transition-all text-lg"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-white">Description</label>
                  <textarea 
                    value={jdDescription}
                    onChange={(e) => setJdDescription(e.target.value)}
                    rows={12}
                    placeholder="Paste job description here..."
                    required
                    className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none text-base"
                  />
                </motion.div>

                <motion.button 
                  variants={itemVariants}
                  type="submit" 
                  disabled={loading || !jdTitle || !jdDescription}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full justify-center py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Analyzing for Bias...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Audit & Clean JD
                    </>
                  )}
                </motion.button>
              </motion.form>

              {auditResult && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  {/* Bias Detection Results */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="premium-card border-l-4 border-amber-500"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <AlertTriangle className="text-amber-400" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Bias Detected</h4>
                        <p className="text-sm text-zinc-400">{auditResult.bias_flags.flags.length} problematic terms found</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {auditResult.bias_flags.flags.map((flag, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-zinc-400 mb-1">Found: <span className="font-mono bg-orange-500/20 text-orange-400 px-2 py-1 rounded">"{flag.term}"</span></p>
                              <p className="text-xs text-zinc-500 mb-2">Category: <span className="font-semibold text-zinc-300">{flag.category}</span></p>
                              <p className="text-sm"><span className="text-zinc-400">Suggestion:</span> <span className="text-emerald-400 font-semibold">"{flag.alternative}"</span></p>
                            </div>
                            <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Cleaned Description */}
                  <motion.div 
                    variants={itemVariants}
                    className="premium-card border-l-4 border-emerald-500"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <CheckCircle2 className="text-emerald-400" size={24} />
                      </div>
                      <h4 className="text-lg font-bold text-white">Improved Description</h4>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-6 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-white/5">
                      {auditResult.cleaned_description}
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4"
                  >
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigator.clipboard.writeText(auditResult.cleaned_description)}
                      className="flex-1 py-3 px-4 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all font-semibold"
                    >
                      Copy Cleaned Description
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setAuditResult(null);
                        setJdTitle('');
                        setJdDescription('');
                      }}
                      className="flex-1 py-3 px-4 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-white/5 transition-all font-semibold"
                    >
                      Audit Another JD
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'candidates' && (
            <motion.div 
              key="candidates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Blind Resume Submission</h1>
                <p className="text-zinc-400 text-lg">Submit resumes for anonymized, skill-based evaluation</p>
              </motion.div>

              {!selectedJd ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="premium-card text-center p-12 border-l-4 border-red-500 bg-red-500/5"
                >
                  <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                  <h3 className="text-2xl font-bold text-white mb-2">No Role Selected</h3>
                  <p className="text-zinc-400 mb-6">Please audit a Job Description first to upload candidates for that role.</p>
                  <motion.button 
                    onClick={() => setActiveTab('post')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary mx-auto"
                  >
                    <FileText size={20} />
                    Audit a Job First
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleUploadResume}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* File Drop Zone */}
                  <motion.div 
                    variants={itemVariants}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                      dragActive
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-zinc-600 hover:border-cyan-500/50 hover:bg-white/5'
                    }`}
                  >
                    <input 
                      type="file" 
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.docx,.txt"
                    />
                    <motion.div
                      animate={{ y: dragActive ? -5 : 0 }}
                    >
                      <Upload className={`mx-auto mb-4 transition-colors ${dragActive ? 'text-cyan-400' : 'text-zinc-500'}`} size={56} />
                      <p className="font-semibold text-white text-lg">
                        {resumeFile ? resumeFile.name : 'Click or drag resume file here'}
                      </p>
                      <p className="text-sm text-zinc-500 mt-2">PDF, DOCX, or TXT • Maximum 5MB</p>
                    </motion.div>
                  </motion.div>

                  {/* Demographic Dropdown */}
                  <motion.div variants={itemVariants} className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-white">Demographic Category <span className="text-zinc-500">(For Fairness Tracking)</span></label>
                    <select 
                      value={demographicGroup}
                      onChange={(e) => setDemographicGroup(e.target.value)}
                      className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 transition-all text-base cursor-pointer"
                      required
                    >
                      <option value="">Select a category...</option>
                      <option value="Gender: Male">Gender: Male</option>
                      <option value="Gender: Female">Gender: Female</option>
                      <option value="Ethnicity: Asian">Ethnicity: Asian</option>
                      <option value="Ethnicity: African American">Ethnicity: African American</option>
                      <option value="Ethnicity: Hispanic">Ethnicity: Hispanic</option>
                      <option value="Ethnicity: Caucasian">Ethnicity: Caucasian</option>
                      <option value="Age: Under 30">Age: Under 30</option>
                      <option value="Age: 30-50">Age: 30-50</option>
                      <option value="Age: 50+">Age: 50+</option>
                    </select>
                    <div className="flex items-start gap-2 mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <ShieldCheck className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-blue-300">This data is encrypted, anonymized, and stripped from the resume before skill evaluation.</p>
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button 
                    variants={itemVariants}
                    type="submit" 
                    disabled={loading || !resumeFile || !demographicGroup}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full justify-center py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Anonymizing & Evaluating...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Submit Anonymous Resume
                      </>
                    )}
                  </motion.button>

                  {/* Status Messages */}
                  <AnimatePresence>
                    {uploadStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-300"
                      >
                        <CheckCircle2 size={20} />
                        <div>
                          <p className="font-semibold">✓ Resume Processed Successfully</p>
                          <p className="text-sm text-emerald-300/80">PII removed and match score calculated. Check the dashboard!</p>
                        </div>
                      </motion.div>
                    )}
                    {uploadStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300"
                      >
                        <AlertCircle size={20} />
                        <p className="font-semibold">✗ Upload failed. Please try again.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
