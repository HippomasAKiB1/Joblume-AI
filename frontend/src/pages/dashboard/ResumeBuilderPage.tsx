import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeAPI } from '../../services/api';
import { ResumeData, DEFAULT_RESUME_DATA, TEMPLATES, Education, Experience, Project, Certification, Language, Award } from '../../types';
import { Save, Download, FileText, Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import './ResumeBuilder.css';

const uid = () => Math.random().toString(36).slice(2, 9);

export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled Resume');
  const [template, setTemplate] = useState('modern-professional');
  const [data, setData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (id) {
      resumeAPI.get(id).then(r => {
        setTitle(r.data.title);
        setTemplate(r.data.template_name);
        setData({ ...DEFAULT_RESUME_DATA, ...r.data.json_data });
      }).catch(() => { toast.error('Resume not found'); navigate('/dashboard/resumes'); });
    }
  }, [id, navigate]);

  const save = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      await resumeAPI.update(id, { title, template_name: template, json_data: data });
      toast.success('Saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }, [id, title, template, data]);

  const updatePersonal = (field: string, value: string) => {
    setData(d => ({ ...d, personalInfo: { ...d.personalInfo, [field]: value } }));
  };

  const addItem = (section: 'education' | 'experience' | 'projects' | 'certifications' | 'languages' | 'awards') => {
    const templates: Record<string, any> = {
      education: { id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
      experience: { id: uid(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] },
      projects: { id: uid(), name: '', description: '', technologies: '', link: '' },
      certifications: { id: uid(), name: '', issuer: '', date: '', url: '' },
      languages: { id: uid(), name: '', level: 'Intermediate' },
      awards: { id: uid(), title: '', issuer: '', date: '', description: '' },
    };
    setData(d => ({ ...d, [section]: [...(d[section] as any[]), templates[section]] }));
  };

  const removeItem = (section: string, idx: number) => {
    setData(d => ({ ...d, [section]: (d[section as keyof ResumeData] as any[]).filter((_: any, i: number) => i !== idx) }));
  };

  const updateItem = (section: string, idx: number, field: string, value: any) => {
    setData(d => {
      const arr = [...(d[section as keyof ResumeData] as any[])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...d, [section]: arr };
    });
  };

  const exportPDF = async () => {
    if (!id) return;
    await save();
    try {
      const res = await resumeAPI.exportPDF(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${title}.pdf`; a.click();
    } catch { toast.error('Export failed'); }
  };

  const exportDOCX = async () => {
    if (!id) return;
    await save();
    try {
      const res = await resumeAPI.exportDOCX(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${title}.docx`; a.click();
    } catch { toast.error('Export failed'); }
  };

  const sections = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'summary', label: 'Summary' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'projects', label: 'Projects' },
    { key: 'skills', label: 'Skills' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'languages', label: 'Languages' },
    { key: 'awards', label: 'Awards' },
  ];

  return (
    <div className="builder-page">
      {/* ── Toolbar ─── */}
      <div className="builder-toolbar">
        <input className="builder-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Resume Title" />
        <select className="select builder-template-select" value={template} onChange={e => setTemplate(e.target.value)}>
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="builder-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportPDF}><Download size={16} /> PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={exportDOCX}><FileText size={16} /> DOCX</button>
        </div>
      </div>

      <div className="builder-layout">
        {/* ── Form Panel ─── */}
        <div className="builder-form">
          <div className="section-tabs">
            {sections.map(s => (
              <button key={s.key} className={`section-tab ${activeSection === s.key ? 'active' : ''}`} onClick={() => setActiveSection(s.key)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="form-content">
            {activeSection === 'personal' && (
              <div className="form-section animate-fade-in">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="input-group"><label>Full Name</label><input className="input" value={data.personalInfo.fullName} onChange={e => updatePersonal('fullName', e.target.value)} /></div>
                  <div className="input-group"><label>Email</label><input className="input" type="email" value={data.personalInfo.email} onChange={e => updatePersonal('email', e.target.value)} /></div>
                  <div className="input-group"><label>Phone</label><input className="input" value={data.personalInfo.phone} onChange={e => updatePersonal('phone', e.target.value)} /></div>
                  <div className="input-group"><label>Location</label><input className="input" value={data.personalInfo.location} onChange={e => updatePersonal('location', e.target.value)} /></div>
                  <div className="input-group"><label>LinkedIn</label><input className="input" value={data.personalInfo.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} /></div>
                  <div className="input-group"><label>Website</label><input className="input" value={data.personalInfo.website} onChange={e => updatePersonal('website', e.target.value)} /></div>
                </div>
              </div>
            )}

            {activeSection === 'summary' && (
              <div className="form-section animate-fade-in">
                <h3>Professional Summary</h3>
                <textarea className="textarea" rows={5} placeholder="Write a compelling summary of your professional background..." value={data.summary} onChange={e => setData(d => ({ ...d, summary: e.target.value }))} />
              </div>
            )}

            {activeSection === 'education' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Education</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('education')}><Plus size={16} /> Add</button></div>
                {data.education.map((edu, i) => (
                  <div key={edu.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('education', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Institution</label><input className="input" value={edu.institution} onChange={e => updateItem('education', i, 'institution', e.target.value)} /></div>
                      <div className="input-group"><label>Degree</label><input className="input" value={edu.degree} onChange={e => updateItem('education', i, 'degree', e.target.value)} /></div>
                      <div className="input-group"><label>Field</label><input className="input" value={edu.field} onChange={e => updateItem('education', i, 'field', e.target.value)} /></div>
                      <div className="input-group"><label>GPA</label><input className="input" value={edu.gpa} onChange={e => updateItem('education', i, 'gpa', e.target.value)} /></div>
                      <div className="input-group"><label>Start Date</label><input className="input" type="month" value={edu.startDate} onChange={e => updateItem('education', i, 'startDate', e.target.value)} /></div>
                      <div className="input-group"><label>End Date</label><input className="input" type="month" value={edu.endDate} onChange={e => updateItem('education', i, 'endDate', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Experience</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('experience')}><Plus size={16} /> Add</button></div>
                {data.experience.map((exp, i) => (
                  <div key={exp.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('experience', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Job Title</label><input className="input" value={exp.title} onChange={e => updateItem('experience', i, 'title', e.target.value)} /></div>
                      <div className="input-group"><label>Company</label><input className="input" value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} /></div>
                      <div className="input-group"><label>Location</label><input className="input" value={exp.location} onChange={e => updateItem('experience', i, 'location', e.target.value)} /></div>
                      <div className="input-group"><label>Start</label><input className="input" type="month" value={exp.startDate} onChange={e => updateItem('experience', i, 'startDate', e.target.value)} /></div>
                      <div className="input-group"><label>End</label><input className="input" type="month" value={exp.endDate} onChange={e => updateItem('experience', i, 'endDate', e.target.value)} disabled={exp.current} /></div>
                      <div className="input-group"><label className="checkbox-label"><input type="checkbox" checked={exp.current} onChange={e => updateItem('experience', i, 'current', e.target.checked)} /> Currently working here</label></div>
                    </div>
                    <div className="bullets-section">
                      <label>Bullet Points</label>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} className="bullet-row">
                          <span className="bullet-dot">•</span>
                          <input className="input" value={b} onChange={e => { const bullets = [...exp.bullets]; bullets[bi] = e.target.value; updateItem('experience', i, 'bullets', bullets); }} placeholder="Describe your achievement..." />
                          <button className="btn-icon btn-ghost" onClick={() => { const bullets = exp.bullets.filter((_, j) => j !== bi); updateItem('experience', i, 'bullets', bullets); }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm" onClick={() => updateItem('experience', i, 'bullets', [...exp.bullets, ''])}><Plus size={14} /> Add Bullet</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'projects' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Projects</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('projects')}><Plus size={16} /> Add</button></div>
                {data.projects.map((p, i) => (
                  <div key={p.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('projects', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Project Name</label><input className="input" value={p.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} /></div>
                      <div className="input-group"><label>Technologies</label><input className="input" value={p.technologies} onChange={e => updateItem('projects', i, 'technologies', e.target.value)} /></div>
                      <div className="input-group full-width"><label>Description</label><textarea className="textarea" rows={3} value={p.description} onChange={e => updateItem('projects', i, 'description', e.target.value)} /></div>
                      <div className="input-group"><label>Link</label><input className="input" value={p.link} onChange={e => updateItem('projects', i, 'link', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="form-section animate-fade-in">
                <h3>Skills</h3>
                <p className="form-hint">Enter skills separated by commas or press Enter to add.</p>
                <div className="skills-tags">
                  {data.skills.map((s, i) => (
                    <span key={i} className="skill-tag badge badge-primary">
                      {s} <button onClick={() => setData(d => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))}>&times;</button>
                    </span>
                  ))}
                </div>
                <input className="input" placeholder="Type a skill and press Enter..." onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim().replace(',', '');
                    if (val && !data.skills.includes(val)) { setData(d => ({ ...d, skills: [...d.skills, val] })); (e.target as HTMLInputElement).value = ''; }
                  }
                }} />
              </div>
            )}

            {activeSection === 'certifications' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Certifications</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('certifications')}><Plus size={16} /> Add</button></div>
                {data.certifications.map((c, i) => (
                  <div key={c.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('certifications', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Name</label><input className="input" value={c.name} onChange={e => updateItem('certifications', i, 'name', e.target.value)} /></div>
                      <div className="input-group"><label>Issuer</label><input className="input" value={c.issuer} onChange={e => updateItem('certifications', i, 'issuer', e.target.value)} /></div>
                      <div className="input-group"><label>Date</label><input className="input" type="month" value={c.date} onChange={e => updateItem('certifications', i, 'date', e.target.value)} /></div>
                      <div className="input-group"><label>URL</label><input className="input" value={c.url} onChange={e => updateItem('certifications', i, 'url', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'languages' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Languages</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('languages')}><Plus size={16} /> Add</button></div>
                {data.languages.map((l, i) => (
                  <div key={l.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('languages', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Language</label><input className="input" value={l.name} onChange={e => updateItem('languages', i, 'name', e.target.value)} /></div>
                      <div className="input-group"><label>Level</label>
                        <select className="select" value={l.level} onChange={e => updateItem('languages', i, 'level', e.target.value)}>
                          <option>Native</option><option>Fluent</option><option>Advanced</option><option>Intermediate</option><option>Beginner</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'awards' && (
              <div className="form-section animate-fade-in">
                <div className="section-header-row"><h3>Awards</h3><button className="btn btn-secondary btn-sm" onClick={() => addItem('awards')}><Plus size={16} /> Add</button></div>
                {data.awards.map((a, i) => (
                  <div key={a.id} className="form-entry card">
                    <button className="entry-delete" onClick={() => removeItem('awards', i)}><Trash2 size={16} /></button>
                    <div className="form-grid">
                      <div className="input-group"><label>Title</label><input className="input" value={a.title} onChange={e => updateItem('awards', i, 'title', e.target.value)} /></div>
                      <div className="input-group"><label>Issuer</label><input className="input" value={a.issuer} onChange={e => updateItem('awards', i, 'issuer', e.target.value)} /></div>
                      <div className="input-group"><label>Date</label><input className="input" type="month" value={a.date} onChange={e => updateItem('awards', i, 'date', e.target.value)} /></div>
                      <div className="input-group full-width"><label>Description</label><textarea className="textarea" rows={2} value={a.description} onChange={e => updateItem('awards', i, 'description', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Live Preview Panel ─── */}
        <div className="builder-preview">
          <div className="preview-paper">
            <div className="preview-header-section">
              <h1 className="preview-name">{data.personalInfo.fullName || 'Your Name'}</h1>
              <p className="preview-contacts">
                {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join(' • ')}
              </p>
              {data.personalInfo.linkedin && <p className="preview-contacts">{data.personalInfo.linkedin}</p>}
            </div>

            {data.summary && (
              <div className="preview-section">
                <h2 className="preview-section-title">Professional Summary</h2>
                <p className="preview-text">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Experience</h2>
                {data.experience.map(exp => (
                  <div key={exp.id} className="preview-entry">
                    <div className="preview-entry-header">
                      <strong>{exp.title}</strong>{exp.company && <span> — {exp.company}</span>}
                    </div>
                    <div className="preview-entry-date">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</div>
                    <ul className="preview-bullets">{exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}

            {data.education.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Education</h2>
                {data.education.map(edu => (
                  <div key={edu.id} className="preview-entry">
                    <div className="preview-entry-header"><strong>{edu.degree}</strong>{edu.institution && <span> — {edu.institution}</span>}</div>
                    <div className="preview-entry-date">{edu.startDate} – {edu.endDate} {edu.gpa && `• GPA: ${edu.gpa}`}</div>
                  </div>
                ))}
              </div>
            )}

            {data.skills.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Skills</h2>
                <p className="preview-text">{data.skills.join(' • ')}</p>
              </div>
            )}

            {data.projects.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Projects</h2>
                {data.projects.map(p => (
                  <div key={p.id} className="preview-entry">
                    <div className="preview-entry-header"><strong>{p.name}</strong>{p.technologies && <span className="preview-tech"> ({p.technologies})</span>}</div>
                    <p className="preview-text">{p.description}</p>
                  </div>
                ))}
              </div>
            )}

            {data.certifications.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Certifications</h2>
                {data.certifications.map(c => (
                  <div key={c.id} className="preview-entry"><strong>{c.name}</strong> — {c.issuer} ({c.date})</div>
                ))}
              </div>
            )}

            {data.languages.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Languages</h2>
                <p className="preview-text">{data.languages.map(l => `${l.name} (${l.level})`).join(' • ')}</p>
              </div>
            )}

            {data.awards.length > 0 && (
              <div className="preview-section">
                <h2 className="preview-section-title">Awards</h2>
                {data.awards.map(a => (
                  <div key={a.id} className="preview-entry"><strong>{a.title}</strong> — {a.issuer} ({a.date})</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
