import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../../services/api';
import { Resume, DEFAULT_RESUME_DATA } from '../../types';
import { FileText, Plus, Trash2, Copy, Download, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function MyResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    resumeAPI.list().then(r => setResumes(r.data)).catch(() => toast.error('Failed to load resumes')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async () => {
    try {
      const res = await resumeAPI.create({ title: 'Untitled Resume', template_name: 'modern-professional', json_data: DEFAULT_RESUME_DATA });
      toast.success('Resume created!');
      navigate(`/dashboard/resumes/edit/${res.data.id}`);
    } catch { toast.error('Failed to create resume'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume?')) return;
    try { await resumeAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed to delete'); }
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      await resumeAPI.create({ title: `${resume.title} (Copy)`, template_name: resume.template_name, json_data: resume.json_data });
      toast.success('Duplicated!'); load();
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleExportPDF = async (id: string, title: string) => {
    try {
      const res = await resumeAPI.exportPDF(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${title}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="dash-header flex-between">
        <div><h1 className="dash-title">My Resumes</h1><p className="dash-subtitle">Manage all your resumes in one place</p></div>
        <button className="btn btn-primary" onClick={handleCreate}><Plus size={18} /> New Resume</button>
      </div>
      {loading ? (
        <div className="skeleton-grid"><div className="skeleton" style={{height:'120px'}}/><div className="skeleton" style={{height:'120px'}}/></div>
      ) : resumes.length === 0 ? (
        <div className="empty-state card"><FileText size={48} className="empty-icon"/><h3>No resumes yet</h3><p>Create your first resume to start your job search.</p><button className="btn btn-primary" onClick={handleCreate}><Plus size={18}/> Create Resume</button></div>
      ) : (
        <div className="resume-grid">
          <button className="resume-card-new card card-hover" onClick={handleCreate}>
            <Plus size={32} />
            <span>New Resume</span>
          </button>
          {resumes.map(r => (
            <div key={r.id} className="resume-card card card-hover">
              <div className="resume-card-preview" onClick={() => navigate(`/dashboard/resumes/edit/${r.id}`)}>
                <FileText size={40} />
                <span className="resume-template-badge badge badge-primary">{r.template_name}</span>
              </div>
              <div className="resume-card-info">
                <h3 className="truncate">{r.title}</h3>
                <p>Updated {new Date(r.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="resume-card-actions">
                <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => navigate(`/dashboard/resumes/edit/${r.id}`)}><Edit3 size={16}/></button>
                <button className="btn btn-ghost btn-sm" title="Duplicate" onClick={() => handleDuplicate(r)}><Copy size={16}/></button>
                <button className="btn btn-ghost btn-sm" title="Download PDF" onClick={() => handleExportPDF(r.id, r.title)}><Download size={16}/></button>
                <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(r.id)}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .resume-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-5); }
        .resume-card { padding: 0; overflow: hidden; }
        .resume-card-new { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); min-height: 260px; color: var(--text-tertiary); cursor: pointer; border: 2px dashed var(--border-light); background: transparent; font-size: var(--text-sm); font-weight: 600; }
        .resume-card-new:hover { border-color: var(--primary); color: var(--primary); }
        .resume-card-preview { height: 180px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); cursor: pointer; position: relative; color: var(--primary); }
        .resume-template-badge { position: absolute; top: var(--space-3); right: var(--space-3); }
        .resume-card-info { padding: var(--space-4); }
        .resume-card-info h3 { font-size: var(--text-sm); font-weight: 600; }
        .resume-card-info p { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px; }
        .resume-card-actions { display: flex; gap: var(--space-1); padding: 0 var(--space-3) var(--space-3); }
      `}</style>
    </div>
  );
}
