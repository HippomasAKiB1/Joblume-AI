import React, { useState } from 'react';
import {
  MasterProfileProvider,
  useMasterProfile,
} from '../../context/MasterProfileContext';
import { PersonalInfoSection } from '../../components/profile/PersonalInfoSection';
import { SummarySection } from '../../components/profile/SummarySection';
import { ExperienceSection } from '../../components/profile/ExperienceSection';
import { EducationSection } from '../../components/profile/EducationSection';
import { SkillsSection } from '../../components/profile/SkillsSection';
import { ProjectsSection } from '../../components/profile/ProjectsSection';
import { CertificationsSection } from '../../components/profile/CertificationsSection';
import { LanguagesSection } from '../../components/profile/LanguagesSection';
import { AwardsSection } from '../../components/profile/AwardsSection';
import { CustomSections } from '../../components/profile/CustomSections';
import {
  User,
  AlignLeft,
  Briefcase,
  GraduationCap,
  Cpu,
  FolderGit2,
  Award,
  Globe,
  Trophy,
  Layers,
  ChevronDown,
  ChevronRight,
  Save,
  CheckCircle2,
  ChevronsUpDown,
} from 'lucide-react';
import './Dashboard.css';

// Section IDs matching backend canonical profile
type SectionId =
  | 'personal_info'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'custom_sections';

const MasterProfileContent: React.FC = () => {
  const {
    profile,
    loading,
    saving,
    saveProfile,
    updatePersonalInfo,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    setSkills,
    addSkill,
    removeSkill,
    addCertification,
    updateCertification,
    removeCertification,
    addLanguage,
    updateLanguage,
    removeLanguage,
    addAward,
    updateAward,
    removeAward,
    addCustomSection,
    updateCustomSection,
    removeCustomSection,
    addCustomSectionItem,
    updateCustomSectionItem,
    removeCustomSectionItem,
  } = useMasterProfile();

  // UX Decision B: Collapsible accordion. Top 4 expanded by default, rest collapsed.
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    personal_info: true,
    summary: true,
    experience: true,
    education: true,
    skills: false,
    projects: false,
    certifications: false,
    languages: false,
    awards: false,
    custom_sections: false,
  });

  const toggleSection = (id: SectionId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (expand: boolean) => {
    setExpanded({
      personal_info: expand,
      summary: expand,
      experience: expand,
      education: expand,
      skills: expand,
      projects: expand,
      certifications: expand,
      languages: expand,
      awards: expand,
      custom_sections: expand,
    });
  };

  const allExpanded = Object.values(expanded).every(Boolean);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Master Profile career bank...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>Failed to load Master Profile.</p>
      </div>
    );
  }

  return (
    <div className="master-profile-page animate-fade-in">
      {/* Top Header & Manual Save Bar */}
      <div className="master-header-bar">
        <div className="header-titles">
          <h1 className="dash-title">Master Profile (Career Bank)</h1>
          <p className="dash-subtitle">
            Your canonical source of truth for all career experiences, credentials, and achievements.
            Tailored resume views draw entries directly from this master bank.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => toggleAll(!allExpanded)}
            title={allExpanded ? 'Collapse all sections' : 'Expand all sections'}
          >
            <ChevronsUpDown size={15} />
            <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary save-master-btn"
            onClick={() => saveProfile()}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner spinner-sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accordion Sections Container */}
      <div className="accordion-container">
        {/* 1. Personal Information */}
        <div className={`accordion-card ${expanded.personal_info ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('personal_info')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <User size={18} />
              </div>
              <div>
                <h3 className="section-title">Personal Information</h3>
                <p className="section-subtitle">Name, contact details, and professional portfolio links</p>
              </div>
            </div>
            <div className="accordion-status-area">
              {profile.personal_info?.fullName && (
                <span className="section-count-pill">{profile.personal_info.fullName}</span>
              )}
              {expanded.personal_info ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.personal_info && (
            <PersonalInfoSection
              data={profile.personal_info}
              onChange={updatePersonalInfo}
            />
          )}
        </div>

        {/* 2. Professional Summary */}
        <div className={`accordion-card ${expanded.summary ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('summary')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <AlignLeft size={18} />
              </div>
              <div>
                <h3 className="section-title">Professional Summary</h3>
                <p className="section-subtitle">Master career pitch and high-level value proposition</p>
              </div>
            </div>
            <div className="accordion-status-area">
              {profile.summary && (
                <span className="section-count-pill">
                  {profile.summary.length > 50
                    ? `${profile.summary.slice(0, 40)}...`
                    : `${profile.summary.length} chars`}
                </span>
              )}
              {expanded.summary ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.summary && (
            <SummarySection
              summary={profile.summary}
              onChange={updateSummary}
            />
          )}
        </div>

        {/* 3. Work Experience */}
        <div className={`accordion-card ${expanded.experience ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('experience')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Briefcase size={18} />
              </div>
              <div>
                <h3 className="section-title">Work Experience</h3>
                <p className="section-subtitle">Career roles, quantifiable accomplishments, and tagged bullets</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.experience.length} {profile.experience.length === 1 ? 'role' : 'roles'}
              </span>
              {expanded.experience ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.experience && (
            <ExperienceSection
              items={profile.experience}
              onAdd={addExperience}
              onUpdate={updateExperience}
              onRemove={removeExperience}
            />
          )}
        </div>

        {/* 4. Education */}
        <div className={`accordion-card ${expanded.education ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('education')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <GraduationCap size={18} />
              </div>
              <div>
                <h3 className="section-title">Education</h3>
                <p className="section-subtitle">Degrees, diplomas, academic institutions, and GPA</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.education.length} {profile.education.length === 1 ? 'degree' : 'degrees'}
              </span>
              {expanded.education ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.education && (
            <EducationSection
              items={profile.education}
              onAdd={addEducation}
              onUpdate={updateEducation}
              onRemove={removeEducation}
            />
          )}
        </div>

        {/* 5. Skills Bank */}
        <div className={`accordion-card ${expanded.skills ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('skills')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="section-title">Skills & Competencies</h3>
                <p className="section-subtitle">Technical, functional, and domain skills categorized by tags</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.skills.length} {profile.skills.length === 1 ? 'skill' : 'skills'}
              </span>
              {expanded.skills ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.skills && (
            <SkillsSection
              skills={profile.skills}
              onSetSkills={setSkills}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
            />
          )}
        </div>

        {/* 6. Projects */}
        <div className={`accordion-card ${expanded.projects ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('projects')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <FolderGit2 size={18} />
              </div>
              <div>
                <h3 className="section-title">Projects</h3>
                <p className="section-subtitle">Open-source contributions, commercial apps, and side ventures</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.projects.length} {profile.projects.length === 1 ? 'project' : 'projects'}
              </span>
              {expanded.projects ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.projects && (
            <ProjectsSection
              items={profile.projects}
              onAdd={addProject}
              onUpdate={updateProject}
              onRemove={removeProject}
            />
          )}
        </div>

        {/* 7. Certifications */}
        <div className={`accordion-card ${expanded.certifications ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('certifications')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Award size={18} />
              </div>
              <div>
                <h3 className="section-title">Certifications & Licenses</h3>
                <p className="section-subtitle">Industry credentials, cloud certifications, and licenses</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.certifications.length} {profile.certifications.length === 1 ? 'certificate' : 'certificates'}
              </span>
              {expanded.certifications ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.certifications && (
            <CertificationsSection
              items={profile.certifications}
              onAdd={addCertification}
              onUpdate={updateCertification}
              onRemove={removeCertification}
            />
          )}
        </div>

        {/* 8. Languages */}
        <div className={`accordion-card ${expanded.languages ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('languages')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="section-title">Languages</h3>
                <p className="section-subtitle">Native, professional, and conversational languages</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.languages.length} {profile.languages.length === 1 ? 'language' : 'languages'}
              </span>
              {expanded.languages ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.languages && (
            <LanguagesSection
              items={profile.languages}
              onAdd={addLanguage}
              onUpdate={updateLanguage}
              onRemove={removeLanguage}
            />
          )}
        </div>

        {/* 9. Honors & Awards */}
        <div className={`accordion-card ${expanded.awards ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('awards')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Trophy size={18} />
              </div>
              <div>
                <h3 className="section-title">Honors & Awards</h3>
                <p className="section-subtitle">Hackathons, company recognitions, scholarships, and honors</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.awards.length} {profile.awards.length === 1 ? 'award' : 'awards'}
              </span>
              {expanded.awards ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.awards && (
            <AwardsSection
              items={profile.awards}
              onAdd={addAward}
              onUpdate={updateAward}
              onRemove={removeAward}
            />
          )}
        </div>

        {/* 10. Custom Sections */}
        <div className={`accordion-card ${expanded.custom_sections ? 'is-expanded' : ''}`}>
          <div
            className="accordion-header"
            onClick={() => toggleSection('custom_sections')}
            role="button"
            tabIndex={0}
          >
            <div className="accordion-title-area">
              <div className="section-icon-badge">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="section-title">Custom Sections</h3>
                <p className="section-subtitle">Volunteer work, publications, speaking, patents, or extra categories</p>
              </div>
            </div>
            <div className="accordion-status-area">
              <span className="section-count-pill">
                {profile.custom_sections.length} {profile.custom_sections.length === 1 ? 'section' : 'sections'}
              </span>
              {expanded.custom_sections ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
          {expanded.custom_sections && (
            <CustomSections
              sections={profile.custom_sections}
              onAddSection={addCustomSection}
              onUpdateSection={updateCustomSection}
              onRemoveSection={removeCustomSection}
              onAddItem={addCustomSectionItem}
              onUpdateItem={updateCustomSectionItem}
              onRemoveItem={removeCustomSectionItem}
            />
          )}
        </div>
      </div>

      <style>{`
        .master-profile-page {
          max-width: 900px;
          margin: 0 auto;
          padding-bottom: 80px;
        }
        .master-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .header-titles {
          flex: 1;
          min-width: 280px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          position: sticky;
          top: 16px;
          z-index: 10;
        }
        .save-master-btn {
          min-width: 140px;
          box-shadow: var(--shadow-md);
        }
        .accordion-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .accordion-card {
          background: var(--bg-elevated, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .accordion-card.is-expanded {
          border-color: var(--border-medium, #cbd5e1);
          box-shadow: var(--shadow-md);
        }
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          user-select: none;
          background: var(--bg-elevated, #ffffff);
          transition: background 0.15s ease;
        }
        .accordion-header:hover {
          background: var(--bg-hover, #f8fafc);
        }
        .accordion-title-area {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .section-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(79, 70, 229, 0.08);
          color: var(--primary, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }
        .section-subtitle {
          font-size: 12px;
          color: var(--text-secondary, #64748b);
          margin: 2px 0 0 0;
        }
        .accordion-status-area {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-tertiary, #94a3b8);
        }
        .section-count-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          background: var(--bg-primary, #f1f5f9);
          color: var(--text-secondary, #475569);
          border-radius: 9999px;
          border: 1px solid var(--border-light, #e2e8f0);
        }
        .profile-section-body {
          padding: 0 20px 20px 20px;
          border-top: 1px solid var(--border-light, #f1f5f9);
          padding-top: 18px;
        }
        .grid-2-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        .grid-3-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 640px) {
          .grid-2-col, .grid-3-col {
            grid-template-columns: 1fr;
          }
        }
        .empty-section-prompt {
          text-align: center;
          padding: 32px 16px;
          background: var(--bg-hover, #f8fafc);
          border: 1px dashed var(--border-light, #cbd5e1);
          border-radius: var(--radius-md, 8px);
        }
        .empty-icon {
          color: var(--text-tertiary, #94a3b8);
          margin-bottom: 10px;
        }
        .empty-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #1e293b);
          margin: 0 0 4px 0;
        }
        .empty-desc {
          font-size: 12px;
          color: var(--text-secondary, #64748b);
          margin: 0 0 16px 0;
        }
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .entry-card {
          padding: 16px;
          background: var(--bg-elevated, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .entry-title-area {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .entry-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary, #4f46e5);
          background: rgba(79, 70, 229, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .entry-title-text {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin: 0;
        }
        .entry-company-text {
          font-size: 13px;
          color: var(--text-secondary, #64748b);
        }
        .delete-btn {
          color: var(--danger, #ef4444);
        }
        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger, #ef4444);
        }
        .add-entry-btn {
          width: 100%;
          border: 1px dashed var(--border-light, #cbd5e1);
          padding: 10px;
          font-weight: 600;
        }
        .bullets-container {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border-light, #f1f5f9);
        }
        .bullets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .bullets-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary, #475569);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .bullet-row {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .bullet-num {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-tertiary, #94a3b8);
          padding-top: 8px;
          min-width: 18px;
        }
        .bullet-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bullet-input {
          font-size: 13px;
          line-height: 1.4;
        }
        .bullet-tags-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tags-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary, #64748b);
        }
        .bullet-delete-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary, #94a3b8);
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          margin-top: 4px;
        }
        .bullet-delete-btn:hover {
          color: var(--danger, #ef4444);
          background: rgba(239, 68, 68, 0.1);
        }
        .input-hint {
          font-size: 11px;
          color: var(--text-tertiary, #64748b);
          margin: 0 0 6px 0;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary, #475569);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default function MasterProfilePage() {
  return (
    <MasterProfileProvider>
      <MasterProfileContent />
    </MasterProfileProvider>
  );
}
