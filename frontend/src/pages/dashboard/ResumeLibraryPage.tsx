import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeViewAPI } from '../../services/apiV2';
import type { ResumeViewSummary } from '../../types/v2';
import {
  FileText,
  Plus,
  Clock,
  Building,
  History,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function ResumeLibraryPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeViewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await resumeViewAPI.list();
      setResumes(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load resume library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCreateNew = async () => {
    try {
      setCreating(true);
      const res = await resumeViewAPI.create({
        title: 'Untitled Resume',
        template_id: 'minimal-ats',
        primary_color: '#111827',
      });
      const newResume = res.data;
      toast.success('New resume view created!');
      navigate(`/dashboard/resumes/${newResume.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create resume view');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await resumeViewAPI.delete(id);
      toast.success('Resume deleted');
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete resume');
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading resume library...</p>
      </div>
    );
  }

  return (
    <div className="resume-library-page animate-fade-in">
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dash-title">Resume Library</h1>
          <p className="dash-subtitle">
            Tailor, style, and manage your targeted resume views pulled directly from your Master Profile.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateNew}
          disabled={creating}
        >
          {creating ? (
            <>
              <div className="spinner spinner-sm" /> Creating...
            </>
          ) : (
            <>
              <Plus size={16} /> New Resume
            </>
          )}
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="card empty-library-card">
          <div className="empty-library-graphic">
            <FileText size={48} className="empty-icon" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 8px 0' }}>
            Create your first tailored resume
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px auto', fontSize: '14px' }}>
            Resume views draw your career entries directly from your Master Profile. You can style, filter, and adapt them for specific job targets.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleCreateNew}
            disabled={creating}
          >
            <Plus size={18} /> Create Resume
          </button>
        </div>
      ) : (
        <div className="resumes-grid">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="resume-card card"
              onClick={() => navigate(`/dashboard/resumes/${resume.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="resume-card-top">
                <div className="resume-thumb-placeholder" style={{ borderLeft: `4px solid ${resume.primary_color || 'var(--primary)'}` }}>
                  <FileText size={28} className="thumb-icon" style={{ color: resume.primary_color || 'var(--primary)' }} />
                </div>
                <div className="resume-card-meta">
                  <h3 className="resume-card-title">{resume.title || 'Untitled Resume'}</h3>
                  <div className="resume-card-pill">
                    Template: <span style={{ textTransform: 'capitalize' }}>{resume.template_id?.replace('-', ' ') || 'Minimal ATS'}</span>
                  </div>
                </div>
              </div>

              {resume.target_company && (
                <div className="resume-target-row">
                  <Building size={13} />
                  <span>Target: {resume.target_company}</span>
                </div>
              )}

              <div className="resume-card-footer">
                <div className="footer-meta">
                  <span className="updated-text">
                    <Clock size={12} /> {formatTimestamp(resume.updated_at)}
                  </span>
                  {resume.version_count !== undefined && resume.version_count > 0 && (
                    <span className="version-badge">
                      <History size={12} /> v{resume.version_count}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="card-delete-btn"
                  onClick={(e) => handleDelete(e, resume.id, resume.title)}
                  title="Delete resume"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .resume-library-page {
          max-width: 1100px;
          margin: 0 auto;
        }
        .empty-library-card {
          text-align: center;
          padding: 60px 24px;
          margin-top: 24px;
        }
        .empty-library-graphic {
          width: 80px;
          height: 80px;
          background: rgba(79, 70, 229, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .empty-icon {
          color: var(--primary, #4f46e5);
        }
        .resumes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .resume-card {
          padding: 18px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid var(--border-light, #e2e8f0);
        }
        .resume-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary, #4f46e5);
        }
        .resume-card-top {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 12px;
        }
        .resume-thumb-placeholder {
          width: 52px;
          height: 64px;
          background: var(--bg-hover, #f8fafc);
          border-radius: var(--radius-sm, 4px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px var(--border-light, #e2e8f0);
        }
        .resume-card-meta {
          flex: 1;
          overflow: hidden;
        }
        .resume-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .resume-card-pill {
          font-size: 12px;
          color: var(--text-secondary, #64748b);
        }
        .resume-target-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-tertiary, #64748b);
          margin-bottom: 12px;
          padding: 4px 8px;
          background: var(--bg-hover, #f8fafc);
          border-radius: var(--radius-sm, 4px);
        }
        .resume-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-light, #f1f5f9);
          padding-top: 10px;
          margin-top: auto;
        }
        .footer-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .updated-text {
          font-size: 11px;
          color: var(--text-tertiary, #94a3b8);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .version-badge {
          font-size: 11px;
          font-weight: 600;
          background: rgba(79, 70, 229, 0.08);
          color: var(--primary, #4f46e5);
          padding: 1px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .card-delete-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary, #94a3b8);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .card-delete-btn:hover {
          color: var(--danger, #ef4444);
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}
