import { useNavigate } from 'react-router-dom';
import { TEMPLATES, DEFAULT_RESUME_DATA } from '../../types';
import { resumeAPI } from '../../services/api';
import { Layout, ArrowRight, Briefcase, FileText, BookOpen, Globe, Palette, FileSearch, Tie } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function TemplatesPage() {
  const navigate = useNavigate();

  const useTemplate = async (templateId: string) => {
    try {
      const res = await resumeAPI.create({ title: 'Untitled Resume', template_name: templateId, json_data: DEFAULT_RESUME_DATA });
      toast.success('Resume created with template!');
      navigate(`/dashboard/resumes/edit/${res.data.id}`);
    } catch { toast.error('Failed to create resume'); }
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'modern-professional': return <Briefcase size={40} strokeWidth={1.5} />;
      case 'minimal-ats': return <FileSearch size={40} strokeWidth={1.5} />;
      case 'harvard-style': return <BookOpen size={40} strokeWidth={1.5} />;
      case 'europass': return <Globe size={40} strokeWidth={1.5} />;
      case 'creative-designer': return <Palette size={40} strokeWidth={1.5} />;
      case 'academic-cv': return <FileText size={40} strokeWidth={1.5} />;
      case 'executive-resume': return <Tie size={40} strokeWidth={1.5} />;
      default: return <Layout size={40} strokeWidth={1.5} />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dash-header">
        <h1 className="dash-title">Resume Templates</h1>
        <p className="dash-subtitle">Choose a professionally designed template to get started</p>
      </div>
      <div className="templates-grid">
        {TEMPLATES.map(t => (
          <div key={t.id} className="template-card card card-hover">
            <div className="template-preview">
              <div className="icon-soft">{getTemplateIcon(t.id)}</div>
            </div>
            <div className="template-info">
              <span className="badge badge-primary">{t.category}</span>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <button className="btn btn-primary btn-sm w-full" onClick={() => useTemplate(t.id)}>
                Use Template <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
        .template-card { padding: 0; overflow: hidden; }
        .template-preview { height: 180px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-light); }
        .template-info { padding: var(--space-5); }
        .template-info h3 { font-size: var(--text-lg); font-weight: 700; margin: var(--space-3) 0 var(--space-2); }
        .template-info p { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4); line-height: 1.5; }
      `}</style>
    </div>
  );
}
