import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ResumeViewDetail, MasterProfile } from '../types/v2';
import type { PaperSize } from '../components/editor/PaperPreview';

export interface LocalViewConfig {
  title: string;
  template_id: string;
  primary_color: string;
  font_family: string;
  section_order: string[];
  section_visibility: Record<string, boolean>;
  selected_entry_ids: Record<string, string[]>;
  content_overrides: Record<string, any>;
  target_job_title?: string | null;
  target_company?: string | null;
}

export interface ResumeEditorState {
  view: ResumeViewDetail | null;
  master: MasterProfile | null;
  localConfig: LocalViewConfig;
  paperSize: PaperSize;
  zoom: number;
  loading: boolean;
  error: string | null;
}

export const defaultLocalConfig: LocalViewConfig = {
  title: 'Untitled Resume',
  template_id: 'minimal-ats',
  primary_color: '#111827',
  font_family: 'Inter',
  section_order: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'awards',
    'custom_sections',
  ],
  section_visibility: {
    personal_info: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    languages: true,
    awards: true,
    custom_sections: true,
  },
  selected_entry_ids: {},
  content_overrides: {},
  target_job_title: null,
  target_company: null,
};

export type ResumeEditorAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { view: ResumeViewDetail; master: MasterProfile } }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_TEMPLATE'; payload: string }
  | { type: 'SET_PRIMARY_COLOR'; payload: string }
  | { type: 'SET_FONT_FAMILY'; payload: string }
  | { type: 'SET_SECTION_ORDER'; payload: string[] }
  | { type: 'SET_SECTION_VISIBILITY'; payload: Record<string, boolean> }
  | { type: 'SET_SELECTED_ENTRIES'; payload: Record<string, string[]> }
  | { type: 'SET_CONTENT_OVERRIDES'; payload: Record<string, any> }
  | { type: 'SET_TARGET_JOB'; payload: { title?: string | null; company?: string | null } }
  | { type: 'SET_PAPER_SIZE'; payload: PaperSize }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'UPDATE_VIEW_SUCCESS'; payload: ResumeViewDetail };

export function resumeEditorReducer(
  state: ResumeEditorState,
  action: ResumeEditorAction
): ResumeEditorState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };

    case 'LOAD_SUCCESS': {
      const { view, master } = action.payload;
      return {
        ...state,
        loading: false,
        error: null,
        view,
        master,
        localConfig: {
          title: view.title || defaultLocalConfig.title,
          template_id: view.template_id || defaultLocalConfig.template_id,
          primary_color: view.primary_color || defaultLocalConfig.primary_color,
          font_family: view.font_family || defaultLocalConfig.font_family,
          section_order:
            view.section_order && view.section_order.length > 0
              ? view.section_order
              : defaultLocalConfig.section_order,
          section_visibility:
            view.section_visibility && Object.keys(view.section_visibility).length > 0
              ? view.section_visibility
              : defaultLocalConfig.section_visibility,
          selected_entry_ids: view.selected_entry_ids || {},
          content_overrides: view.content_overrides || {},
          target_job_title: view.target_job_title ?? null,
          target_company: view.target_company ?? null,
        },
      };
    }

    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'SET_TITLE':
      return {
        ...state,
        localConfig: { ...state.localConfig, title: action.payload },
      };

    case 'SET_TEMPLATE':
      return {
        ...state,
        localConfig: { ...state.localConfig, template_id: action.payload },
      };

    case 'SET_PRIMARY_COLOR':
      return {
        ...state,
        localConfig: { ...state.localConfig, primary_color: action.payload },
      };

    case 'SET_FONT_FAMILY':
      return {
        ...state,
        localConfig: { ...state.localConfig, font_family: action.payload },
      };

    case 'SET_SECTION_ORDER':
      return {
        ...state,
        localConfig: { ...state.localConfig, section_order: action.payload },
      };

    case 'SET_SECTION_VISIBILITY':
      return {
        ...state,
        localConfig: { ...state.localConfig, section_visibility: action.payload },
      };

    case 'SET_SELECTED_ENTRIES':
      return {
        ...state,
        localConfig: { ...state.localConfig, selected_entry_ids: action.payload },
      };

    case 'SET_CONTENT_OVERRIDES':
      return {
        ...state,
        localConfig: { ...state.localConfig, content_overrides: action.payload },
      };

    case 'SET_TARGET_JOB':
      return {
        ...state,
        localConfig: {
          ...state.localConfig,
          target_job_title: action.payload.title !== undefined ? action.payload.title : state.localConfig.target_job_title,
          target_company: action.payload.company !== undefined ? action.payload.company : state.localConfig.target_company,
        },
      };

    case 'SET_PAPER_SIZE':
      return { ...state, paperSize: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    case 'UPDATE_VIEW_SUCCESS':
      return {
        ...state,
        view: action.payload,
        localConfig: {
          ...state.localConfig,
          title: action.payload.title || state.localConfig.title,
          template_id: action.payload.template_id || state.localConfig.template_id,
          primary_color: action.payload.primary_color || state.localConfig.primary_color,
          font_family: action.payload.font_family || state.localConfig.font_family,
          section_order: action.payload.section_order || state.localConfig.section_order,
          section_visibility: action.payload.section_visibility || state.localConfig.section_visibility,
          selected_entry_ids: action.payload.selected_entry_ids || state.localConfig.selected_entry_ids,
        },
      };

    default:
      return state;
  }
}

interface ResumeEditorContextValue extends ResumeEditorState {
  dispatch: React.Dispatch<ResumeEditorAction>;
  setTitle: (title: string) => void;
  setTemplate: (templateId: string) => void;
  setPrimaryColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setSectionOrder: (order: string[]) => void;
  setSectionVisibility: (vis: Record<string, boolean>) => void;
  setSelectedEntryIds: (ids: Record<string, string[]>) => void;
  setPaperSize: (size: PaperSize) => void;
  setZoom: (zoom: number) => void;
  updateServerView: (view: ResumeViewDetail) => void;
}

const ResumeEditorContext = createContext<ResumeEditorContextValue | null>(null);

export const ResumeEditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(resumeEditorReducer, {
    view: null,
    master: null,
    localConfig: defaultLocalConfig,
    paperSize: 'a4',
    zoom: 1.0,
    loading: true,
    error: null,
  });

  const setTitle = (title: string) => dispatch({ type: 'SET_TITLE', payload: title });
  const setTemplate = (templateId: string) => dispatch({ type: 'SET_TEMPLATE', payload: templateId });
  const setPrimaryColor = (color: string) => dispatch({ type: 'SET_PRIMARY_COLOR', payload: color });
  const setFontFamily = (font: string) => dispatch({ type: 'SET_FONT_FAMILY', payload: font });
  const setSectionOrder = (order: string[]) => dispatch({ type: 'SET_SECTION_ORDER', payload: order });
  const setSectionVisibility = (vis: Record<string, boolean>) => dispatch({ type: 'SET_SECTION_VISIBILITY', payload: vis });
  const setSelectedEntryIds = (ids: Record<string, string[]>) => dispatch({ type: 'SET_SELECTED_ENTRIES', payload: ids });
  const setPaperSize = (size: PaperSize) => dispatch({ type: 'SET_PAPER_SIZE', payload: size });
  const setZoom = (zoom: number) => dispatch({ type: 'SET_ZOOM', payload: zoom });
  const updateServerView = (view: ResumeViewDetail) => dispatch({ type: 'UPDATE_VIEW_SUCCESS', payload: view });

  const value: ResumeEditorContextValue = {
    ...state,
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
  };

  return <ResumeEditorContext.Provider value={value}>{children}</ResumeEditorContext.Provider>;
};

export const useResumeEditor = (): ResumeEditorContextValue => {
  const context = useContext(ResumeEditorContext);
  if (!context) {
    throw new Error('useResumeEditor must be used within a ResumeEditorProvider');
  }
  return context;
};
