import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resumeAPI, applicationAPI } from '../../services/api';
import { Resume, Application } from '../../types';
import { FileText, Plus, ClipboardList, ScanSearch, Wand2, TrendingUp, ArrowRight } from 'lucide-react';
import './Dashboard.css';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      resumeAPI.list().then(r => setResumes(r.data)).catch(() => {}),
      applicationAPI.list().then(r => setApplications(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { icon: Plus, label: 'New Resume', desc: 'Create from scratch', action: () => navigate('/dashboard/resumes') },
    { icon: Wand2, label: 'Tailor Resume', desc: 'Match to a job', action: () => navigate('/dashboard/job-tailor') },
    { icon: ScanSearch, label: 'ATS Check', desc: 'Check ATS score', action: () => navigate('/dashboard/ats-scanner') },
    { icon: ClipboardList, label: 'Track App', desc: 'Add application', action: () => navigate('/dashboard/applications') },
  ];

  const statusCounts = {
    applied: applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer: applications.filter(a => a.status === 'Offer').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  return (
    <div className="dashboard-home animate-fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="dash-subtitle">Here's your career progress at a glance.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><FileText size={22} /></div>
          <div><p className="stat-card-num">{resumes.length}</p><p className="stat-card-label">Resumes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--secondary-soft)', color: 'var(--secondary)' }}><ClipboardList size={22} /></div>
          <div><p className="stat-card-num">{applications.length}</p><p className="stat-card-label">Applications</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><TrendingUp size={22} /></div>
          <div><p className="stat-card-num">{statusCounts.interview}</p><p className="stat-card-label">Interviews</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Wand2 size={22} /></div>
          <div><p className="stat-card-num">{statusCounts.offer}</p><p className="stat-card-label">Offers</p></div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="dash-section-title">Quick Actions</h2>
      <div className="quick-actions-grid">
        {quickActions.map((qa, i) => (
          <button key={i} className="quick-action-card card card-hover" onClick={qa.action}>
            <div className="qa-icon"><qa.icon size={24} /></div>
            <div>
              <h3>{qa.label}</h3>
              <p>{qa.desc}</p>
            </div>
            <ArrowRight size={18} className="qa-arrow" />
          </button>
        ))}
      </div>

      {/* Recent Resumes */}
      <h2 className="dash-section-title">Recent Resumes</h2>
      {loading ? (
        <div className="skeleton-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="empty-state card">
          <FileText size={40} className="empty-icon" />
          <h3>No resumes yet</h3>
          <p>Create your first resume to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/resumes')}>Create Resume</button>
        </div>
      ) : (
        <div className="recent-list">
          {resumes.slice(0, 5).map(r => (
            <div key={r.id} className="recent-item card card-hover" onClick={() => navigate(`/dashboard/resumes/edit/${r.id}`)}>
              <div className="recent-item-icon"><FileText size={20} /></div>
              <div className="recent-item-info">
                <h4>{r.title}</h4>
                <p>{r.template_name} · Updated {new Date(r.updated_at).toLocaleDateString()}</p>
              </div>
              <ArrowRight size={18} className="recent-arrow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
