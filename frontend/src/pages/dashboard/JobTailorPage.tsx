import { useState, useEffect } from 'react';
import { resumeAPI, aiAPI } from '../../services/api';
import { Resume, JobTailorResult } from '../../types';
import { Wand2, Upload, Target, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';
import SubscriptionGate from '../../components/subscription/SubscriptionGate';

export default function JobTailorPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobTailorResult | null>(null);

  useEffect(() => { resumeAPI.list().then(r => setResumes(r.data)).catch(() => {}); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await aiAPI.uploadJD(file);
      setJdText(res.data.text);
      toast.success('File parsed successfully!');
    } catch { toast.error('Failed to parse file'); }
  };

  const handleTailor = async () => {
    if (!selectedResume) { toast.error('Select a resume first'); return; }
    if (!jdText.trim()) { toast.error('Enter a job description'); return; }
    setLoading(true);
    try {
      const res = await aiAPI.tailorJob({ resume_id: selectedResume, job_description: jdText });
      setResult(res.data);
      toast.success('Analysis complete!');
    } catch { toast.error('AI analysis failed. Check your API key.'); }
    finally { setLoading(false); }
  };

  const scoreColor = (score: number) => score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <SubscriptionGate title="AI Job Tailor Engine">
      <div className="animate-fade-in">
      <div className="dash-header">
        <h1 className="dash-title">Job Tailor AI</h1>
        <p className="dash-subtitle">Optimize your resume to match any job description</p>
      </div>

      <div className="tailor-layout">
        <div className="tailor-input card">
          <div className="input-group">
            <label>Select Resume</label>
            <select className="select" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
              <option value="">Choose a resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Job Description</label>
            <textarea className="textarea" rows={12} placeholder="Paste the job description here..." value={jdText} onChange={e => setJdText(e.target.value)} />
          </div>
          <div className="upload-zone">
            <Upload size={20} />
            <span>Or upload PDF/DOCX</span>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} />
          </div>
          <button className="btn btn-primary w-full btn-lg" onClick={handleTailor} disabled={loading}>
            {loading ? <><div className="spinner" /> Analyzing...</> : <><Wand2 size={18} /> Analyze & Tailor</>}
          </button>
        </div>

        <div className="tailor-results">
          {!result && !loading && (
            <div className="empty-state card"><Target size={48} className="empty-icon" /><h3>Upload a job description</h3><p>We'll analyze your resume against the JD and provide optimization tips.</p></div>
          )}
          {loading && <div className="card" style={{padding:'var(--space-12)',textAlign:'center'}}><div className="spinner spinner-lg" style={{margin:'0 auto var(--space-4)'}} /><p>AI is analyzing your resume...</p></div>}
          {result && (
            <>
              <div className="card" style={{textAlign:'center',padding:'var(--space-8)'}}>
                <div className="score-gauge" style={{margin:'0 auto'}}>
                  <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-light)" strokeWidth="8" /><circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor(result.match_score)} strokeWidth="8" strokeDasharray={`${result.match_score * 3.39} 999`} strokeLinecap="round" /></svg>
                  <div style={{textAlign:'center'}}><span className="score-value">{result.match_score}</span><br/><span className="score-label">Match Score</span></div>
                </div>
              </div>
              {result.missing_keywords.length > 0 && (
                <div className="card"><h3 style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}><AlertCircle size={18} color="var(--warning)" /> Missing Keywords</h3>
                  <div className="skills-tags">{result.missing_keywords.map((k,i) => <span key={i} className="badge badge-warning">{k}</span>)}</div></div>
              )}
              {result.optimized_summary && (
                <div className="card"><h3 style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}><CheckCircle size={18} color="var(--success)" /> Optimized Summary</h3><p style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',lineHeight:'1.7'}}>{result.optimized_summary}</p></div>
              )}
              {result.improved_bullets.length > 0 && (
                <div className="card"><h3 style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}><Lightbulb size={18} color="var(--primary)" /> Improved Bullet Points</h3>
                  <ul style={{paddingLeft:'20px'}}>{result.improved_bullets.map((b,i) => <li key={i} style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',marginBottom:'8px'}}>{b}</li>)}</ul></div>
              )}
              {result.suggested_skills.length > 0 && (
                <div className="card"><h3 style={{marginBottom:'12px'}}>Suggested Skills</h3>
                  <div className="skills-tags">{result.suggested_skills.map((s,i) => <span key={i} className="badge badge-info">{s}</span>)}</div></div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .tailor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start; }
        .tailor-input { display: flex; flex-direction: column; gap: var(--space-5); }
        .tailor-results { display: flex; flex-direction: column; gap: var(--space-4); }
        .upload-zone { position: relative; display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); border: 2px dashed var(--border-light); border-radius: var(--radius-md); color: var(--text-tertiary); font-size: var(--text-sm); cursor: pointer; }
        .upload-zone:hover { border-color: var(--primary); color: var(--primary); }
        .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        @media (max-width: 1024px) { .tailor-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
    </SubscriptionGate>
  );
}
