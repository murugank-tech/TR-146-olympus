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
  LogOut
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
  Cell
} from 'recharts';

const API_BASE = 'http://localhost:8000';

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
  const [demographicGroup, setDemographicGroup] = useState('Group A');
  const [uploadStatus, setUploadStatus] = useState(null);

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
      // Evaluate immediately
      await axios.post(`${API_BASE}/evaluate?candidate_id=${uploadRes.data.candidate_id}&job_id=${selectedJd.id}`);
      fetchRankings(selectedJd.id);
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-zinc-100">
      {/* Sidebar */}
      <nav className="w-64 border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">EquiHire</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('post')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'post' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <FileText size={20} />
            Job Audit
          </button>
          <button 
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'candidates' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={20} />
            Candidates
          </button>
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
            <p className="text-xs text-zinc-500 mb-2 uppercase font-semibold">Bias Status</p>
            <div className="flex items-center gap-2 text-secondary">
              <CheckCircle2 size={16} />
              <span className="text-sm">Engine Active</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Fairness Dashboard</h1>
                  <p className="text-zinc-500">Monitoring algorithmic fairness and candidate selection metrics.</p>
                </div>
                {selectedJd && (
                   <div className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-sm italic">
                    Active Role: <span className="text-primary font-medium">{selectedJd.title}</span>
                   </div>
                )}
              </div>

              {!selectedJd ? (
                <div className="premium-card text-center py-20">
                  <BrainCircuit className="mx-auto text-zinc-700 mb-6" size={64} />
                  <h2 className="text-xl font-medium mb-4">No Active Job Description</h2>
                  <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Upload and audit a job description first to start evaluation and fairness monitoring.</p>
                  <button onClick={() => setActiveTab('post')} className="btn-primary mx-auto">
                    Audit Job Description <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Rankings Table */}
                    <div className="premium-card">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Top Candidate Rankings</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Users size={16} />
                          {rankings.length} Applicants
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-500 text-sm">
                              <th className="pb-4 font-medium">Candidate ID</th>
                              <th className="pb-4 font-medium text-center">Skill Score</th>
                              <th className="pb-4 font-medium text-center">Match</th>
                              <th className="pb-4 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankings.map((ev, i) => (
                              <tr key={i} className="border-b border-white/5 last:border-0 group">
                                <td className="py-4 font-mono text-sm text-primary">{ev.candidate_id}</td>
                                <td className="py-4">
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="flex-1 w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary" 
                                        style={{ width: `${ev.final_score}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold">{Math.round(ev.final_score)}%</span>
                                  </div>
                                </td>
                                <td className="py-4 text-center">
                                   <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">High</span>
                                </td>
                                <td className="py-4 text-right">
                                  <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
                                    <Search size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Fairness Score */}
                    <div className="premium-card">
                      <h3 className="text-lg font-bold mb-6">Disparate Impact Analysis</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={fairnessReport}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="group" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            />
                            <Bar dataKey="dir" radius={[4, 4, 0, 0]}>
                              {fairnessReport.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.bias_flag ? '#ef4444' : '#3b82f6'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-6 flex flex-col gap-4">
                        {fairnessReport.map((report, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                            <span className="text-sm font-medium">{report.group}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">DIR: {report.dir}</span>
                              {report.bias_flag ? (
                                <AlertTriangle size={14} className="text-error" />
                              ) : (
                                <CheckCircle2 size={14} className="text-secondary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'post' && (
            <motion.div 
              key="post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">Job Description Audit</h1>
                <p className="text-zinc-500">Detect and remove biased language to attract a diverse talent pool.</p>
              </div>

              <form onSubmit={handleAuditJD} className="premium-card space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-zinc-400">Job Title</label>
                  <input 
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-zinc-400">Description</label>
                  <textarea 
                    value={jdDescription}
                    onChange={(e) => setJdDescription(e.target.value)}
                    rows={10}
                    placeholder="Paste job description here..."
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Analyzing...' : 'Audit & Clean JD'}
                </button>
              </form>

              {auditResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="p-4 bg-zinc-900 border-l-4 border-accent rounded-r-xl">
                    <h4 className="flex items-center gap-2 text-accent font-bold mb-2">
                      <AlertTriangle size={18} />
                      Bias Detection Results
                    </h4>
                    <ul className="space-y-2">
                      {auditResult.bias_flags.flags.map((flag, i) => (
                        <li key={i} className="text-sm">
                          Flagged <span className="bg-error/20 text-error px-1 rounded">"{flag.term}"</span> ({flag.category}) — Suggested alternative: <span className="text-secondary">"{flag.alternative}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="premium-card">
                    <h4 className="font-bold mb-4">Cleaned Description</h4>
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {auditResult.cleaned_description}
                    </div>
                  </div>
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
              className="max-w-2xl mx-auto space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">Blind Resume Submission</h1>
                <p className="text-zinc-500">Submit resumes for anonymized, skill-based evaluation.</p>
              </div>

              {!selectedJd ? (
                 <div className="premium-card text-center bg-error/5 border-error/20">
                    <h3 className="text-error font-bold mb-2">No Role Selected</h3>
                    <p className="text-sm">Please audit a Job Description first to upload candidates for that role.</p>
                 </div>
              ) : (
                <form onSubmit={handleUploadResume} className="premium-card space-y-6">
                  <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center hover:border-primary/50 transition-all cursor-pointer relative">
                    <input 
                      type="file" 
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-zinc-500 mb-4" size={48} />
                    <p className="font-medium text-zinc-300">
                      {resumeFile ? resumeFile.name : 'Click or drag PDF/DOCX resume'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">Maximum file size: 5MB</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-400">Demographic Group (Internal Tracking Only)</label>
                    <select 
                      value={demographicGroup}
                      onChange={(e) => setDemographicGroup(e.target.value)}
                    >
                      <option value="Group A">Gender: Male</option>
                      <option value="Group B">Gender: Female</option>
                      <option value="Group C">Ethnicity: Minority</option>
                      <option value="Group D">Ethnicity: Majority</option>
                    </select>
                    <p className="text-xs text-zinc-600 italic mt-1">
                      <ShieldCheck size={12} className="inline mr-1" />
                      This data is encrypted and stripped from the resume before evaluation.
                    </p>
                  </div>

                  <button type="submit" disabled={loading || !resumeFile} className="btn-primary w-full justify-center">
                    {loading ? 'Processing Anonymously...' : 'Upload & Anonymize'}
                  </button>

                  {uploadStatus === 'success' && (
                    <div className="p-4 bg-secondary/10 text-secondary rounded-xl text-center text-sm font-medium">
                      ✓ Resume processed, PII removed, and match score calculated!
                    </div>
                  )}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
