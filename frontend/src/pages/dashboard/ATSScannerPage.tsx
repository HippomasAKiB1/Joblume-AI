import { useState, useEffect } from 'react';
import { resumeAPI, aiAPI } from '../../services/api';
import { Resume, ATSScoreResult } from '../../types';
import { ScanSearch, AlertTriangle, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function ATSScannerPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSScoreResult | null>(null);

  useEffect(() => { resumeAPI.list().then(r => setResumes(r.data)).catch(() => {}); }, []);

  const scan = async () => {
    if (!selectedResume) { toast.error('Select a resume first'); return; }
    setLoading(true);
    try {
      const res = await aiAPI.atsScore({ resume_id: selectedResume });
      setResult(res.data);
      toast.success('Scan complete!');
    } catch { toast.error('Scan failed'); }
    finally { setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)';
  const scoreLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Needs Work' : 'Poor';

  return (
    <div className="animate-fade-in">
      <div className="dash-header"><h1 className="dash-title">ATS Scanner</h1><p className="dash-subtitle">Check your resume's ATS compatibility score</p></div>

      <div className="ats-controls card" style={{display:'flex',gap:'var(--space-4)',alignItems:'flex-end',marginBottom:'var(--space-6)',flexWrap:'wrap'}}>
        <div className="input-group" style={{flex:1,minWidth:200}}>
          <label>Select Resume</label>
          <select className="select" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
            <option value="">Choose a resume...</option>
            {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-lg" onClick={scan} disabled={loading}>
          {loading ? <><div className="spinner" /> Scanning...</> : <><ScanSearch size={18} /> Scan Resume</>}
        </button>
      </div>

      {!result && !loading && (
        <div className="empty-state card"><ScanSearch size={48} className="empty-icon" /><h3>Select a resume to scan</h3><p>We'll analyze formatting, keywords, action verbs, and more.</p></div>
      )}

      {loading && <div className="card" style={{padding:'var(--space-12)',textAlign:'center'}}><div className="spinner spinner-lg" style={{margin:'0 auto var(--space-4)'}} /><p>Scanning your resume...</p></div>}

      {result && (
        <div className="ats-results">
          <div className="card ats-score-card">
            <div className="score-gauge" style={{margin:'0 auto'}}>
              <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-light)" strokeWidth="8" /><circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor(result.score)} strokeWidth="8" strokeDasharray={`${result.score * 3.39} 999`} strokeLinecap="round" /></svg>
              <div style={{textAlign:'center'}}><span className="score-value">{result.score}</span><br/><span className="score-label">{scoreLabel(result.score)}</span></div>
            </div>
          </div>

          <div className="ats-detail-grid">
            {result.formatting_issues.length > 0 && (
              <div className="card"><h3 className="ats-detail-title"><AlertTriangle size={18} color="var(--warning)" /> Formatting Issues</h3>
                <ul className="ats-list">{result.formatting_issues.map((f,i) => <li key={i}>{f}</li>)}</ul></div>
            )}
            {result.missing_keywords.length > 0 && (
              <div className="card"><h3 className="ats-detail-title"><AlertCircle size={18} color="var(--danger)" /> Missing Keywords</h3>
                <div className="skills-tags">{result.missing_keywords.map((k,i) => <span key={i} className="badge badge-danger">{k}</span>)}</div></div>
            )}
            {result.weak_verbs.length > 0 && (
              <div className="card"><h3 className="ats-detail-title"><AlertCircle size={18} color="var(--warning)" /> Weak Action Verbs</h3>
                <ul className="ats-list">{result.weak_verbs.map((v,i) => <li key={i}>{v}</li>)}</ul></div>
            )}
            {result.improvement_tips.length > 0 && (
              <div className="card"><h3 className="ats-detail-title"><Lightbulb size={18} color="var(--primary)" /> Improvement Tips</h3>
                <ul className="ats-list tips">{result.improvement_tips.map((t,i) => <li key={i}><CheckCircle size={14} /> {t}</li>)}</ul></div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .ats-results { display: flex; flex-direction: column; gap: var(--space-6); }
        .ats-score-card { text-align: center; padding: var(--space-10); }
        .ats-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        .ats-detail-title { display: flex; align-items: center; gap: 8px; font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4); }
        .ats-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
        .ats-list li { font-size: var(--text-sm); color: var(--text-secondary); display: flex; align-items: flex-start; gap: var(--space-2); }
        .ats-list.tips li { color: var(--text-primary); }
        @media (max-width: 768px) { .ats-detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
