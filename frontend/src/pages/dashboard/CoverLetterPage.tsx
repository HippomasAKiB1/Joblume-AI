import { useState, useEffect } from 'react';
import { resumeAPI, aiAPI } from '../../services/api';
import { Resume } from '../../types';
import { Mail, Copy, Download, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';
import SubscriptionGate from '../../components/subscription/SubscriptionGate';

export default function CoverLetterPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { resumeAPI.list().then(r => setResumes(r.data)).catch(() => {}); }, []);

  const generate = async () => {
    if (!selectedResume || !jobTitle || !company) { toast.error('Fill in all required fields'); return; }
    setLoading(true);
    try {
      const res = await aiAPI.generateCoverLetter({ resume_id: selectedResume, job_title: jobTitle, company_name: company, job_description: jdText });
      setContent(res.data.content);
      toast.success('Cover letter generated!');
    } catch { toast.error('Generation failed. Check your API key.'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(content); toast.success('Copied!'); };

  return (
    <SubscriptionGate title="AI Cover Letter Engine">
      <div className="animate-fade-in">
      <div className="dash-header"><h1 className="dash-title">Cover Letter Generator</h1><p className="dash-subtitle">Generate tailored cover letters with AI</p></div>
      <div className="tailor-layout">
        <div className="card" style={{display:'flex',flexDirection:'column',gap:'var(--space-5)',padding:'var(--space-6)'}}>
          <div className="input-group"><label>Select Resume *</label>
            <select className="select" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
              <option value="">Choose a resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="input-group"><label>Job Title *</label><input className="input" placeholder="e.g. AI Specialist" value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
          <div className="input-group"><label>Company Name *</label><input className="input" placeholder="e.g. OpenAI" value={company} onChange={e => setCompany(e.target.value)} /></div>
          <div className="input-group"><label>Job Description (optional)</label><textarea className="textarea" rows={6} placeholder="Paste the job description for better results..." value={jdText} onChange={e => setJdText(e.target.value)} /></div>
          <button className="btn btn-primary w-full btn-lg" onClick={generate} disabled={loading}>
            {loading ? <><div className="spinner" /> Generating...</> : <><Wand2 size={18} /> Generate Cover Letter</>}
          </button>
        </div>
        <div>
          {!content && !loading ? (
            <div className="empty-state card"><Mail size={48} className="empty-icon" /><h3>Generate a cover letter</h3><p>Fill in the details and let AI create a tailored cover letter.</p></div>
          ) : loading ? (
            <div className="card" style={{padding:'var(--space-12)',textAlign:'center'}}><div className="spinner spinner-lg" style={{margin:'0 auto var(--space-4)'}}/><p>Writing your cover letter...</p></div>
          ) : (
            <div className="card">
              <div style={{display:'flex',justifyContent:'flex-end',gap:'var(--space-2)',marginBottom:'var(--space-4)'}}>
                <button className="btn btn-ghost btn-sm" onClick={copyToClipboard}><Copy size={16} /> Copy</button>
              </div>
              <div style={{whiteSpace:'pre-wrap',fontSize:'var(--text-sm)',lineHeight:'1.8',color:'var(--text-secondary)'}}>{content}</div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .tailor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start; }
        @media (max-width: 1024px) { .tailor-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
    </SubscriptionGate>
  );
}
