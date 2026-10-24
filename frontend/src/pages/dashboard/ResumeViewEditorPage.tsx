import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ResumeEditorProvider,
  useResumeEditor,
} from '../../context/ResumeEditorContext';
import { PaperPreview } from '../../components/editor/PaperPreview';
import { EntrySelector } from '../../components/editor/EntrySelector';
import { SectionVisibility } from '../../components/editor/SectionVisibility';
import { SectionOrderList } from '../../components/editor/SectionOrderList';
import { ThemeSelector } from '../../components/editor/ThemeSelector';
import { resumeViewAPI, profileAPI } from '../../services/apiV2';
import { useAuth } from '../../context/AuthContext';
import { isConfigDirty } from '../../utils/dirty';
import type { ResolvedResumeData } from '../../types/v2';
import {
  ArrowLeft,
  Save,
  Layers,
  Palette,
  Layout,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const ResumeViewEditorContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    view,
    master,
    localConfig,
    paperSize,
    zoom,
    loading,
    error,
    dispatch,
    setTitle,
    setTemplate,
    setPrimaryColor,
    setFontFamily,
    setSectionOrder,
    setSectionVisibility,
    setSelectedEntryIds,
    setPaperSize,
    setZoom,
    updateServerView,
  } = useResumeEditor();

  const [activeTab, setActiveTab] = useState<'content' | 'styling' | 'layout'>('content');
  const [saving, setSaving] = useState(false);

  // Initial load
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadData() {
      dispatch({ type: 'LOAD_START' });
      try {
        const [viewRes, profileRes] = await Promise.all([
          resumeViewAPI.get(id!),
          profileAPI.getProfile(),
        ]);
        if (isMounted) {
          dispatch({
            type: 'LOAD_SUCCESS',
            payload: {
              view: viewRes.data,
              master: profileRes.data,
            },
          });
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err.response?.data?.detail || 'Failed to load resume workstation';
          dispatch({ type: 'LOAD_ERROR', payload: msg });
          toast.error(msg);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, dispatch]);

  // Dirty state tracking
  const isDirty = useMemo(() => isConfigDirty(localConfig, view), [localConfig, view]);

  // Design Q3: Unsaved changes warning for browser tab close / reload
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Design Q3: In-app navigation guard for back link
  const handleBackToLibrary = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) return;
    }
    navigate('/dashboard/resumes');
  };

  // Milestone B: Functional Manual Save button
  const handleSave = async () => {
    if (!id || !isDirty || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: localConfig.title,
        template_id: localConfig.template_id,
        primary_color: localConfig.primary_color,
        font_family: localConfig.font_family,
        section_order: localConfig.section_order,
        section_visibility: localConfig.section_visibility,
        selected_entry_ids: localConfig.selected_entry_ids,
        target_job_title: localConfig.target_job_title,
        target_company: localConfig.target_company,
      };

      const res = await resumeViewAPI.update(id, payload);
      updateServerView(res.data);
      toast.success('Resume view saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save resume view');
    } finally {
      setSaving(false);
    }
  };

  // Assemble dynamic live resolved data based on local visibility and entry selection
  const liveResolvedData: ResolvedResumeData = useMemo(() => {
    const base = view?.resolved_data || master;
    if (!base) {
      return {
        template_id: localConfig.template_id,
        primary_color: localConfig.primary_color,
        font_family: localConfig.font_family,
      };
    }

    const vis = localConfig.section_visibility || {};
    const selected = localConfig.selected_entry_ids || {};

    const filterEntries = <T extends { id: string }>(section: string, list?: T[]): T[] => {
      if (!list) return [];
      const sel = selected[section];
      if (!sel) return list; // default all
      return list.filter((item) => sel.includes(item.id));
    };

    return {
      personal_info: vis.personal_info !== false ? base.personal_info : undefined,
      summary: vis.summary !== false ? base.summary : undefined,
      experience: vis.experience !== false ? filterEntries('experience', base.experience) : undefined,
      education: vis.education !== false ? filterEntries('education', base.education) : undefined,
      skills: vis.skills !== false ? base.skills : undefined,
      projects: vis.projects !== false ? filterEntries('projects', base.projects) : undefined,
      certifications: vis.certifications !== false ? filterEntries('certifications', base.certifications) : undefined,
      languages: vis.languages !== false ? filterEntries('languages', base.languages) : undefined,
      awards: vis.awards !== false ? filterEntries('awards', base.awards) : undefined,
      custom_sections: vis.custom_sections !== false ? base.custom_sections : undefined,
      template_id: localConfig.template_id,
      primary_color: localConfig.primary_color,
      font_family: localConfig.font_family,
      section_order: localConfig.section_order,
      section_visibility: localConfig.section_visibility,
    };
  }, [view, master, localConfig]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading resume workstation...</p>
      </div>
    );
  }

  if (error || !view || !master) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error || 'Failed to initialize resume view.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard/resumes')}>
          Return to Resume Library
        </button>
      </div>
    );
  }

  const showWatermark = user?.subscription_tier !== 'pro';

  return (
    <div className="workstation-container">
      {/* Workstation Top Toolbar */}
      <header className="workstation-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleBackToLibrary}
            title="Back to Resumes"
          >
            <ArrowLeft size={16} />
          </button>

          <input
            className="input title-input"
            value={localConfig.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Resume"
          />

          {isDirty ? (
            <span className="unsaved-badge" title="Unsaved changes">
              <AlertCircle size={12} /> Unsaved
            </span>
          ) : (
            <span className="saved-badge" title="All changes saved">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="toolbar-controls">
          {/* Paper Size Toggle */}
          <div className="toolbar-group">
            <span className="control-label">Paper:</span>
            <div className="btn-toggle-group">
              <button
                type="button"
                className={`btn btn-sm ${paperSize === 'a4' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaperSize('a4')}
              >
                A4
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paperSize === 'letter' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaperSize('letter')}
              >
                Letter
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="toolbar-group">
            <span className="control-label">Zoom:</span>
            <div className="btn-toggle-group">
              <button
                type="button"
                className={`btn btn-sm ${zoom === 0.75 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setZoom(0.75)}
              >
                75%
              </button>
              <button
                type="button"
                className={`btn btn-sm ${zoom === 1.0 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setZoom(1.0)}
              >
                100%
              </button>
              <button
                type="button"
                className={`btn btn-sm ${zoom === 1.25 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setZoom(1.25)}
              >
                125%
              </button>
            </div>
          </div>

          {/* Functional Save Button */}
          <button
            type="button"
            className="btn btn-primary save-btn"
            onClick={handleSave}
            disabled={!isDirty || saving}
            title={isDirty ? 'Save changes to this resume view' : 'No unsaved changes'}
          >
            {saving ? (
              <>
                <div className="spinner spinner-sm" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Panel (45%) / Right Preview (55%) */}
      <div className="workstation-split-body">
        {/* Left Panel: Configuration Controls */}
        <aside className="workstation-left-panel">
          <div className="panel-tabs">
            <button
              type="button"
              className={`panel-tab ${activeTab === 'content' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <Layers size={15} /> Content & Entries
            </button>
            <button
              type="button"
              className={`panel-tab ${activeTab === 'styling' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('styling')}
            >
              <Palette size={15} /> Theme & Colors
            </button>
            <button
              type="button"
              className={`panel-tab ${activeTab === 'layout' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('layout')}
            >
              <Layout size={15} /> Section Order
            </button>
          </div>

          <div className="panel-content-area">
            {activeTab === 'content' && (
              <div className="tab-pane animate-fade-in">
                <SectionVisibility
                  visibility={localConfig.section_visibility}
                  onChange={setSectionVisibility}
                />
                <EntrySelector
                  master={master}
                  selectedEntryIds={localConfig.selected_entry_ids}
                  onChange={setSelectedEntryIds}
                />
              </div>
            )}

            {activeTab === 'styling' && (
              <div className="tab-pane animate-fade-in">
                <ThemeSelector
                  templateId={localConfig.template_id}
                  fontFamily={localConfig.font_family}
                  primaryColor={localConfig.primary_color}
                  onTemplateChange={setTemplate}
                  onFontChange={setFontFamily}
                  onColorChange={setPrimaryColor}
                />
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="tab-pane animate-fade-in">
                <SectionOrderList
                  order={localConfig.section_order}
                  onChange={setSectionOrder}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: Live Paper Preview (55%) */}
        <main className="workstation-right-panel">
          <PaperPreview
            data={liveResolvedData}
            templateId={localConfig.template_id}
            primaryColor={localConfig.primary_color}
            fontFamily={localConfig.font_family}
            paperSize={paperSize}
            zoom={zoom}
            sectionOrder={localConfig.section_order}
            showWatermark={showWatermark}
          />
        </main>
      </div>

      <style>{`
        .workstation-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 72px);
          margin: -24px;
          overflow: hidden;
          background: var(--bg-elevated, #ffffff);
        }
        .workstation-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          border-bottom: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-primary, #ffffff);
          flex-wrap: wrap;
          gap: 12px;
          z-index: 10;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 240px;
        }
        .title-input {
          font-size: 16px;
          font-weight: 700;
          max-width: 320px;
          border: 1px solid transparent;
          background: transparent;
        }
        .title-input:hover, .title-input:focus {
          border-color: var(--border-light, #cbd5e1);
          background: var(--bg-hover, #f8fafc);
        }
        .unsaved-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .saved-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .control-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary, #64748b);
        }
        .btn-toggle-group {
          display: flex;
          border: 1px solid var(--border-light, #cbd5e1);
          border-radius: var(--radius-sm, 4px);
          overflow: hidden;
        }
        .btn-toggle-group .btn {
          border-radius: 0;
          border: none;
          padding: 4px 10px;
          font-size: 12px;
        }
        .save-btn {
          min-width: 140px;
        }
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .workstation-split-body {
          display: flex;
          flex: 1;
          height: calc(100% - 53px);
          overflow: hidden;
        }
        .workstation-left-panel {
          width: 45%;
          min-width: 360px;
          border-right: 1px solid var(--border-light, #e2e8f0);
          display: flex;
          flex-direction: column;
          background: var(--bg-primary, #ffffff);
        }
        .panel-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-hover, #f8fafc);
        }
        .panel-tab {
          flex: 1;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .panel-tab.is-active {
          color: var(--primary, #4f46e5);
          border-bottom-color: var(--primary, #4f46e5);
          background: var(--bg-primary, #ffffff);
        }
        .panel-content-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .tab-pane {
          display: flex;
          flex-direction: column;
        }
        .workstation-right-panel {
          width: 55%;
          flex: 1;
          height: 100%;
          position: relative;
          background: var(--bg-hover, #f1f5f9);
        }
      `}</style>
    </div>
  );
};

export default function ResumeViewEditorPage() {
  return (
    <ResumeEditorProvider>
      <ResumeViewEditorContent />
    </ResumeEditorProvider>
  );
}
