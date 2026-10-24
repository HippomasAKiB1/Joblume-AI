import React from 'react';
import type { ResolvedResumeData } from '../../types/v2';
import type { TemplateProps } from './TemplateRegistry';

const defaultSectionOrder = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'awards',
  'custom_sections',
];

export const ModernProfessionalTemplate: React.FC<TemplateProps> = ({
  data,
  primaryColor = '#3b82f6',
  fontFamily = 'Inter',
  sectionOrder = data.section_order || defaultSectionOrder,
}) => {
  const {
    personal_info,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    awards,
    custom_sections,
  } = data;

  const contactItems: string[] = [];
  if (personal_info?.email) contactItems.push(personal_info.email);
  if (personal_info?.phone) contactItems.push(personal_info.phone);
  if (personal_info?.location) contactItems.push(personal_info.location);
  if (personal_info?.website) contactItems.push(personal_info.website);
  if (personal_info?.linkedin) contactItems.push(personal_info.linkedin);
  if (personal_info?.github) contactItems.push(personal_info.github);

  // Section Render Map per Design Q1
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    summary: () =>
      summary && summary.trim() !== '' ? (
        <section key="summary" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 6pt 0' }}>
            About Me
          </h2>
          <p style={{ margin: 0, fontSize: '9.5pt', color: '#4b5563', textAlign: 'justify' }}>{summary}</p>
        </section>
      ) : null,

    experience: () =>
      experience && experience.length > 0 ? (
        <section key="experience" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 8pt 0' }}>
            Experience
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '10.5pt', color: '#111827' }}>
                    {exp.title} {exp.company && <span style={{ fontWeight: 600, color: primaryColor }}>@ {exp.company}</span>}
                  </span>
                  <span style={{ fontSize: '9pt', color: '#6b7280', fontWeight: 500 }}>
                    {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}
                    {exp.current ? 'Present' : exp.endDate}
                    {exp.location ? ` | ${exp.location}` : ''}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul style={{ margin: '4pt 0 0 0', paddingLeft: '14pt', fontSize: '9.5pt', color: '#4b5563' }}>
                    {exp.bullets.map((b) => (
                      <li key={b.id} style={{ marginBottom: '3pt' }}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null,

    education: () =>
      education && education.length > 0 ? (
        <section key="education" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 8pt 0' }}>
            Education
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
            {education.map((edu) => (
              <div key={edu.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '10pt', color: '#111827' }}>
                    {edu.institution} {edu.degree && <span style={{ fontWeight: 500 }}>— {edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>}
                  </span>
                  <span style={{ fontSize: '9pt', color: '#6b7280' }}>
                    {edu.startDate}{edu.startDate && edu.endDate ? ' – ' : ''}{edu.endDate}
                  </span>
                </div>
                {edu.gpa && (
                  <p style={{ margin: '2pt 0 0 0', fontSize: '9pt', color: '#6b7280' }}>GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null,

    skills: () =>
      skills && skills.length > 0 ? (
        <section key="skills" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 8pt 0' }}>
            Skills & Tech Stack
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5pt' }}>
            {skills.map((s) => (
              <span
                key={s.name}
                style={{
                  background: '#f3f4f6',
                  border: '1pt solid #e5e7eb',
                  padding: '2.5pt 8pt',
                  borderRadius: '3pt',
                  fontSize: '9pt',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                {s.name}
                {s.tags && s.tags.length > 0 && (
                  <span style={{ fontSize: '8pt', color: '#6b7280', fontWeight: 400, marginLeft: '4pt' }}>
                    [{s.tags.join(', ')}]
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>
      ) : null,

    projects: () =>
      projects && projects.length > 0 ? (
        <section key="projects" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 8pt 0' }}>
            Key Projects
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
            {projects.map((proj) => (
              <div key={proj.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '10pt', color: '#111827' }}>
                    {proj.name}
                    {proj.technologies && <span style={{ fontSize: '8.5pt', fontWeight: 500, color: primaryColor, marginLeft: '6pt' }}>[{proj.technologies}]</span>}
                  </span>
                  {proj.link && <span style={{ fontSize: '8.5pt', color: '#4b5563' }}>{proj.link}</span>}
                </div>
                {proj.description && <p style={{ margin: '2pt 0 0 0', fontSize: '9pt', color: '#4b5563' }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : null,

    certifications: () =>
      certifications && certifications.length > 0 ? (
        <section key="certifications" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 6pt 0' }}>
            Certifications
          </h2>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '9pt', color: '#4b5563' }}>
            {certifications.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> {c.issuer && `— ${c.issuer}`} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </section>
      ) : null,

    languages: () =>
      languages && languages.length > 0 ? (
        <section key="languages" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 6pt 0' }}>
            Languages
          </h2>
          <p style={{ margin: 0, fontSize: '9pt', color: '#4b5563' }}>
            {languages.map((l, idx) => (
              <span key={l.id}>
                <strong>{l.name}</strong>{l.level ? ` (${l.level})` : ''}
                {idx < languages.length - 1 && ', '}
              </span>
            ))}
          </p>
        </section>
      ) : null,

    awards: () =>
      awards && awards.length > 0 ? (
        <section key="awards" style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 6pt 0' }}>
            Honors & Awards
          </h2>
          <ul style={{ margin: 0, paddingLeft: '14pt', fontSize: '9pt', color: '#4b5563' }}>
            {awards.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong> {a.issuer && `(${a.issuer})`}
              </li>
            ))}
          </ul>
        </section>
      ) : null,

    custom_sections: () =>
      custom_sections && custom_sections.length > 0 ? (
        <React.Fragment key="custom_sections">
          {custom_sections.map((sec) => (
            <section key={sec.id} style={{ marginBottom: '16pt' }}>
              <h2 style={{ fontSize: '11.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor, borderLeft: `3pt solid ${primaryColor}`, paddingLeft: '8pt', margin: '0 0 6pt 0' }}>
                {sec.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
                {sec.items.map((it) => (
                  <div key={it.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '9.5pt', color: '#111827' }}>
                        {it.title} {it.subtitle && <span style={{ fontWeight: 500, color: '#4b5563' }}>— {it.subtitle}</span>}
                      </span>
                      {it.date && <span style={{ fontSize: '8.5pt', color: '#6b7280' }}>{it.date}</span>}
                    </div>
                    {it.description && <p style={{ margin: '2pt 0 0 0', fontSize: '9pt', color: '#4b5563' }}>{it.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </React.Fragment>
      ) : null,
  };

  return (
    <div
      className="modern-template"
      style={{
        fontFamily: `${fontFamily}, sans-serif`,
        color: '#1f2937',
        lineHeight: 1.5,
        fontSize: '10.5pt',
        background: '#ffffff',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* Header Banner */}
      <header
        style={{
          background: primaryColor,
          color: '#ffffff',
          padding: '24pt 28pt',
          marginBottom: '20pt',
          borderRadius: '2pt',
        }}
      >
        <h1 style={{ fontSize: '24pt', fontWeight: 800, margin: '0 0 6pt 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
          {personal_info?.fullName || 'Your Name'}
        </h1>
        {contactItems.length > 0 && (
          <div style={{ fontSize: '9pt', color: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexWrap: 'wrap', gap: '4pt 12pt' }}>
            {contactItems.map((item, idx) => (
              <span key={idx}>
                {item}
                {idx < contactItems.length - 1 && <span style={{ marginLeft: '12pt', opacity: 0.6 }}>•</span>}
              </span>
            ))}
          </div>
        )}
      </header>

      <div style={{ padding: '0 28pt 28pt 28pt' }}>
        {/* Render sections dynamically ordered by sectionOrder */}
        {sectionOrder.map((secKey) => (
          <React.Fragment key={secKey}>
            {sectionRenderers[secKey] ? sectionRenderers[secKey]() : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
