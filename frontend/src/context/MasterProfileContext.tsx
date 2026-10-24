import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { profileAPI } from '../services/apiV2';
import type {
  MasterProfile,
  PersonalInfo,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillItem,
  CertificationItem,
  LanguageItem,
  AwardItem,
  CustomSection,
  CustomSectionItem,
  BulletItem,
} from '../types/v2';
import { generateUUID, ensureId } from '../utils/uuid';
import { normalizeBullets, normalizeList, normalizeSkills } from '../utils/normalize';

interface MasterProfileState {
  profile: MasterProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const defaultPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  portfolio: '',
  photo_url: null,
};

const initialDefaultProfile: MasterProfile = {
  id: '',
  user_id: '',
  personal_info: defaultPersonalInfo,
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  languages: [],
  awards: [],
  custom_sections: [],
  created_at: '',
  updated_at: '',
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: MasterProfile }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; payload: MasterProfile }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  // Experience
  | { type: 'ADD_EXPERIENCE'; payload: Partial<ExperienceItem> }
  | { type: 'UPDATE_EXPERIENCE'; payload: { id: string; item: Partial<ExperienceItem> } }
  | { type: 'REMOVE_EXPERIENCE'; payload: string }
  // Education
  | { type: 'ADD_EDUCATION'; payload: Partial<EducationItem> }
  | { type: 'UPDATE_EDUCATION'; payload: { id: string; item: Partial<EducationItem> } }
  | { type: 'REMOVE_EDUCATION'; payload: string }
  // Projects
  | { type: 'ADD_PROJECT'; payload: Partial<ProjectItem> }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; item: Partial<ProjectItem> } }
  | { type: 'REMOVE_PROJECT'; payload: string }
  // Skills
  | { type: 'SET_SKILLS'; payload: SkillItem[] }
  | { type: 'ADD_SKILL'; payload: SkillItem }
  | { type: 'REMOVE_SKILL'; payload: string }
  // Certifications
  | { type: 'ADD_CERTIFICATION'; payload: Partial<CertificationItem> }
  | { type: 'UPDATE_CERTIFICATION'; payload: { id: string; item: Partial<CertificationItem> } }
  | { type: 'REMOVE_CERTIFICATION'; payload: string }
  // Languages
  | { type: 'ADD_LANGUAGE'; payload: Partial<LanguageItem> }
  | { type: 'UPDATE_LANGUAGE'; payload: { id: string; item: Partial<LanguageItem> } }
  | { type: 'REMOVE_LANGUAGE'; payload: string }
  // Awards
  | { type: 'ADD_AWARD'; payload: Partial<AwardItem> }
  | { type: 'UPDATE_AWARD'; payload: { id: string; item: Partial<AwardItem> } }
  | { type: 'REMOVE_AWARD'; payload: string }
  // Custom Sections
  | { type: 'ADD_CUSTOM_SECTION'; payload: { title: string } }
  | { type: 'UPDATE_CUSTOM_SECTION'; payload: { id: string; section: Partial<CustomSection> } }
  | { type: 'REMOVE_CUSTOM_SECTION'; payload: string }
  | { type: 'ADD_CUSTOM_SECTION_ITEM'; payload: { sectionId: string; item: Partial<CustomSectionItem> } }
  | { type: 'UPDATE_CUSTOM_SECTION_ITEM'; payload: { sectionId: string; itemId: string; item: Partial<CustomSectionItem> } }
  | { type: 'REMOVE_CUSTOM_SECTION_ITEM'; payload: { sectionId: string; itemId: string } };

function masterProfileReducer(state: MasterProfileState, action: Action): MasterProfileState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, profile: action.payload, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SAVE_START':
      return { ...state, saving: true, error: null };
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, profile: action.payload, error: null };
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.payload };

    case 'UPDATE_PERSONAL_INFO': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          personal_info: {
            ...state.profile.personal_info,
            ...action.payload,
          },
        },
      };
    }

    case 'UPDATE_SUMMARY': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          summary: action.payload,
        },
      };
    }

    // ── Experience ──────────────────────────────────────────
    case 'ADD_EXPERIENCE': {
      if (!state.profile) return state;
      const newItem: ExperienceItem = {
        id: generateUUID(),
        title: action.payload.title || '',
        company: action.payload.company || '',
        location: action.payload.location || '',
        startDate: action.payload.startDate || '',
        endDate: action.payload.endDate || '',
        current: action.payload.current ?? false,
        bullets: normalizeBullets(action.payload.bullets || []),
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: [...state.profile.experience, newItem],
        },
      };
    }

    case 'UPDATE_EXPERIENCE': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: state.profile.experience.map((exp) => {
            if (exp.id !== action.payload.id) return exp;
            const updatedBullets = action.payload.item.bullets
              ? normalizeBullets(action.payload.item.bullets)
              : exp.bullets;
            return {
              ...exp,
              ...action.payload.item,
              bullets: updatedBullets,
            };
          }),
        },
      };
    }

    case 'REMOVE_EXPERIENCE': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: state.profile.experience.filter((exp) => exp.id !== action.payload),
        },
      };
    }

    // ── Education ───────────────────────────────────────────
    case 'ADD_EDUCATION': {
      if (!state.profile) return state;
      const newItem: EducationItem = {
        id: generateUUID(),
        institution: action.payload.institution || '',
        degree: action.payload.degree || '',
        field: action.payload.field || '',
        startDate: action.payload.startDate || '',
        endDate: action.payload.endDate || '',
        gpa: action.payload.gpa || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          education: [...state.profile.education, newItem],
        },
      };
    }

    case 'UPDATE_EDUCATION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          education: state.profile.education.map((edu) =>
            edu.id === action.payload.id ? { ...edu, ...action.payload.item } : edu
          ),
        },
      };
    }

    case 'REMOVE_EDUCATION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          education: state.profile.education.filter((edu) => edu.id !== action.payload),
        },
      };
    }

    // ── Projects ────────────────────────────────────────────
    case 'ADD_PROJECT': {
      if (!state.profile) return state;
      const newItem: ProjectItem = {
        id: generateUUID(),
        name: action.payload.name || '',
        description: action.payload.description || '',
        technologies: action.payload.technologies || '',
        link: action.payload.link || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          projects: [...state.profile.projects, newItem],
        },
      };
    }

    case 'UPDATE_PROJECT': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          projects: state.profile.projects.map((proj) =>
            proj.id === action.payload.id ? { ...proj, ...action.payload.item } : proj
          ),
        },
      };
    }

    case 'REMOVE_PROJECT': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          projects: state.profile.projects.filter((proj) => proj.id !== action.payload),
        },
      };
    }

    // ── Skills ──────────────────────────────────────────────
    case 'SET_SKILLS': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          skills: action.payload,
        },
      };
    }

    case 'ADD_SKILL': {
      if (!state.profile) return state;
      const existing = state.profile.skills.find(
        (s) => s.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (existing) {
        // Merge tags if already exists
        const mergedTags = Array.from(new Set([...existing.tags, ...action.payload.tags]));
        return {
          ...state,
          profile: {
            ...state.profile,
            skills: state.profile.skills.map((s) =>
              s.name.toLowerCase() === action.payload.name.toLowerCase()
                ? { ...s, tags: mergedTags }
                : s
            ),
          },
        };
      }
      return {
        ...state,
        profile: {
          ...state.profile,
          skills: [...state.profile.skills, action.payload],
        },
      };
    }

    case 'REMOVE_SKILL': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          skills: state.profile.skills.filter(
            (s) => s.name.toLowerCase() !== action.payload.toLowerCase()
          ),
        },
      };
    }

    // ── Certifications ──────────────────────────────────────
    case 'ADD_CERTIFICATION': {
      if (!state.profile) return state;
      const newItem: CertificationItem = {
        id: generateUUID(),
        name: action.payload.name || '',
        issuer: action.payload.issuer || '',
        date: action.payload.date || '',
        url: action.payload.url || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          certifications: [...state.profile.certifications, newItem],
        },
      };
    }

    case 'UPDATE_CERTIFICATION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          certifications: state.profile.certifications.map((cert) =>
            cert.id === action.payload.id ? { ...cert, ...action.payload.item } : cert
          ),
        },
      };
    }

    case 'REMOVE_CERTIFICATION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          certifications: state.profile.certifications.filter((cert) => cert.id !== action.payload),
        },
      };
    }

    // ── Languages ───────────────────────────────────────────
    case 'ADD_LANGUAGE': {
      if (!state.profile) return state;
      const newItem: LanguageItem = {
        id: generateUUID(),
        name: action.payload.name || '',
        level: action.payload.level || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          languages: [...state.profile.languages, newItem],
        },
      };
    }

    case 'UPDATE_LANGUAGE': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          languages: state.profile.languages.map((lang) =>
            lang.id === action.payload.id ? { ...lang, ...action.payload.item } : lang
          ),
        },
      };
    }

    case 'REMOVE_LANGUAGE': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          languages: state.profile.languages.filter((lang) => lang.id !== action.payload),
        },
      };
    }

    // ── Awards ──────────────────────────────────────────────
    case 'ADD_AWARD': {
      if (!state.profile) return state;
      const newItem: AwardItem = {
        id: generateUUID(),
        title: action.payload.title || '',
        issuer: action.payload.issuer || '',
        date: action.payload.date || '',
        description: action.payload.description || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          awards: [...state.profile.awards, newItem],
        },
      };
    }

    case 'UPDATE_AWARD': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          awards: state.profile.awards.map((award) =>
            award.id === action.payload.id ? { ...award, ...action.payload.item } : award
          ),
        },
      };
    }

    case 'REMOVE_AWARD': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          awards: state.profile.awards.filter((award) => award.id !== action.payload),
        },
      };
    }

    // ── Custom Sections ─────────────────────────────────────
    case 'ADD_CUSTOM_SECTION': {
      if (!state.profile) return state;
      const newSec: CustomSection = {
        id: generateUUID(),
        title: action.payload.title,
        items: [],
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: [...state.profile.custom_sections, newSec],
        },
      };
    }

    case 'UPDATE_CUSTOM_SECTION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: state.profile.custom_sections.map((sec) =>
            sec.id === action.payload.id ? { ...sec, ...action.payload.section } : sec
          ),
        },
      };
    }

    case 'REMOVE_CUSTOM_SECTION': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: state.profile.custom_sections.filter((sec) => sec.id !== action.payload),
        },
      };
    }

    case 'ADD_CUSTOM_SECTION_ITEM': {
      if (!state.profile) return state;
      const newItem: CustomSectionItem = {
        id: generateUUID(),
        title: action.payload.item.title || '',
        subtitle: action.payload.item.subtitle || '',
        date: action.payload.item.date || '',
        description: action.payload.item.description || '',
      };
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: state.profile.custom_sections.map((sec) =>
            sec.id === action.payload.sectionId
              ? { ...sec, items: [...sec.items, newItem] }
              : sec
          ),
        },
      };
    }

    case 'UPDATE_CUSTOM_SECTION_ITEM': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: state.profile.custom_sections.map((sec) =>
            sec.id === action.payload.sectionId
              ? {
                  ...sec,
                  items: sec.items.map((item) =>
                    item.id === action.payload.itemId ? { ...item, ...action.payload.item } : item
                  ),
                }
              : sec
          ),
        },
      };
    }

    case 'REMOVE_CUSTOM_SECTION_ITEM': {
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          custom_sections: state.profile.custom_sections.map((sec) =>
            sec.id === action.payload.sectionId
              ? {
                  ...sec,
                  items: sec.items.filter((item) => item.id !== action.payload.itemId),
                }
              : sec
          ),
        },
      };
    }

    default:
      return state;
  }
}

interface MasterProfileContextValue extends MasterProfileState {
  fetchProfile: () => Promise<void>;
  saveProfile: () => Promise<boolean>;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateSummary: (summary: string) => void;
  addExperience: (item: Partial<ExperienceItem>) => void;
  updateExperience: (id: string, item: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addEducation: (item: Partial<EducationItem>) => void;
  updateEducation: (id: string, item: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  addProject: (item: Partial<ProjectItem>) => void;
  updateProject: (id: string, item: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  setSkills: (skills: SkillItem[]) => void;
  addSkill: (skill: SkillItem) => void;
  removeSkill: (name: string) => void;
  addCertification: (item: Partial<CertificationItem>) => void;
  updateCertification: (id: string, item: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;
  addLanguage: (item: Partial<LanguageItem>) => void;
  updateLanguage: (id: string, item: Partial<LanguageItem>) => void;
  removeLanguage: (id: string) => void;
  addAward: (item: Partial<AwardItem>) => void;
  updateAward: (id: string, item: Partial<AwardItem>) => void;
  removeAward: (id: string) => void;
  addCustomSection: (title: string) => void;
  updateCustomSection: (id: string, section: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;
  addCustomSectionItem: (sectionId: string, item: Partial<CustomSectionItem>) => void;
  updateCustomSectionItem: (sectionId: string, itemId: string, item: Partial<CustomSectionItem>) => void;
  removeCustomSectionItem: (sectionId: string, itemId: string) => void;
}

const MasterProfileContext = createContext<MasterProfileContextValue | null>(null);

export const MasterProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(masterProfileReducer, {
    profile: null,
    loading: true,
    saving: false,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await profileAPI.getProfile();
      const raw = res.data;
      const normalized: MasterProfile = {
        id: raw.id || '',
        user_id: raw.user_id || '',
        personal_info: {
          ...defaultPersonalInfo,
          ...(raw.personal_info || {}),
        },
        summary: raw.summary || '',
        experience: (raw.experience || []).map((exp) => ({
          ...ensureId(exp),
          bullets: normalizeBullets(exp.bullets),
        })),
        education: normalizeList(raw.education),
        projects: normalizeList(raw.projects),
        skills: normalizeSkills(raw.skills),
        certifications: normalizeList(raw.certifications),
        languages: normalizeList(raw.languages),
        awards: normalizeList(raw.awards),
        custom_sections: (raw.custom_sections || []).map((sec) => ({
          ...ensureId(sec),
          items: normalizeList(sec.items),
        })),
        created_at: raw.created_at || '',
        updated_at: raw.updated_at || '',
      };
      dispatch({ type: 'FETCH_SUCCESS', payload: normalized });
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to load master profile';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      toast.error(message);
    }
  }, []);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!state.profile) return false;
    dispatch({ type: 'SAVE_START' });
    try {
      const payload = {
        personal_info: state.profile.personal_info,
        summary: state.profile.summary,
        experience: state.profile.experience,
        education: state.profile.education,
        projects: state.profile.projects,
        skills: state.profile.skills,
        certifications: state.profile.certifications,
        languages: state.profile.languages,
        awards: state.profile.awards,
        custom_sections: state.profile.custom_sections,
      };

      const res = await profileAPI.updateProfile(payload);
      const saved = res.data;
      dispatch({ type: 'SAVE_SUCCESS', payload: saved });
      toast.success('Master profile saved successfully!');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to save master profile';
      dispatch({ type: 'SAVE_ERROR', payload: message });
      toast.error(message);
      return false;
    }
  }, [state.profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Dispatch wrappers
  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: info });
  }, []);

  const updateSummary = useCallback((summary: string) => {
    dispatch({ type: 'UPDATE_SUMMARY', payload: summary });
  }, []);

  const addExperience = useCallback((item: Partial<ExperienceItem>) => {
    dispatch({ type: 'ADD_EXPERIENCE', payload: item });
  }, []);

  const updateExperience = useCallback((id: string, item: Partial<ExperienceItem>) => {
    dispatch({ type: 'UPDATE_EXPERIENCE', payload: { id, item } });
  }, []);

  const removeExperience = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_EXPERIENCE', payload: id });
  }, []);

  const addEducation = useCallback((item: Partial<EducationItem>) => {
    dispatch({ type: 'ADD_EDUCATION', payload: item });
  }, []);

  const updateEducation = useCallback((id: string, item: Partial<EducationItem>) => {
    dispatch({ type: 'UPDATE_EDUCATION', payload: { id, item } });
  }, []);

  const removeEducation = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_EDUCATION', payload: id });
  }, []);

  const addProject = useCallback((item: Partial<ProjectItem>) => {
    dispatch({ type: 'ADD_PROJECT', payload: item });
  }, []);

  const updateProject = useCallback((id: string, item: Partial<ProjectItem>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, item } });
  }, []);

  const removeProject = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PROJECT', payload: id });
  }, []);

  const setSkills = useCallback((skills: SkillItem[]) => {
    dispatch({ type: 'SET_SKILLS', payload: skills });
  }, []);

  const addSkill = useCallback((skill: SkillItem) => {
    dispatch({ type: 'ADD_SKILL', payload: skill });
  }, []);

  const removeSkill = useCallback((name: string) => {
    dispatch({ type: 'REMOVE_SKILL', payload: name });
  }, []);

  const addCertification = useCallback((item: Partial<CertificationItem>) => {
    dispatch({ type: 'ADD_CERTIFICATION', payload: item });
  }, []);

  const updateCertification = useCallback((id: string, item: Partial<CertificationItem>) => {
    dispatch({ type: 'UPDATE_CERTIFICATION', payload: { id, item } });
  }, []);

  const removeCertification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CERTIFICATION', payload: id });
  }, []);

  const addLanguage = useCallback((item: Partial<LanguageItem>) => {
    dispatch({ type: 'ADD_LANGUAGE', payload: item });
  }, []);

  const updateLanguage = useCallback((id: string, item: Partial<LanguageItem>) => {
    dispatch({ type: 'UPDATE_LANGUAGE', payload: { id, item } });
  }, []);

  const removeLanguage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LANGUAGE', payload: id });
  }, []);

  const addAward = useCallback((item: Partial<AwardItem>) => {
    dispatch({ type: 'ADD_AWARD', payload: item });
  }, []);

  const updateAward = useCallback((id: string, item: Partial<AwardItem>) => {
    dispatch({ type: 'UPDATE_AWARD', payload: { id, item } });
  }, []);

  const removeAward = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_AWARD', payload: id });
  }, []);

  const addCustomSection = useCallback((title: string) => {
    dispatch({ type: 'ADD_CUSTOM_SECTION', payload: { title } });
  }, []);

  const updateCustomSection = useCallback((id: string, section: Partial<CustomSection>) => {
    dispatch({ type: 'UPDATE_CUSTOM_SECTION', payload: { id, section } });
  }, []);

  const removeCustomSection = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CUSTOM_SECTION', payload: id });
  }, []);

  const addCustomSectionItem = useCallback((sectionId: string, item: Partial<CustomSectionItem>) => {
    dispatch({ type: 'ADD_CUSTOM_SECTION_ITEM', payload: { sectionId, item } });
  }, []);

  const updateCustomSectionItem = useCallback(
    (sectionId: string, itemId: string, item: Partial<CustomSectionItem>) => {
      dispatch({ type: 'UPDATE_CUSTOM_SECTION_ITEM', payload: { sectionId, itemId, item } });
    },
    []
  );

  const removeCustomSectionItem = useCallback((sectionId: string, itemId: string) => {
    dispatch({ type: 'REMOVE_CUSTOM_SECTION_ITEM', payload: { sectionId, itemId } });
  }, []);

  const value: MasterProfileContextValue = {
    ...state,
    fetchProfile,
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
  };

  return <MasterProfileContext.Provider value={value}>{children}</MasterProfileContext.Provider>;
};

export const useMasterProfile = (): MasterProfileContextValue => {
  const context = useContext(MasterProfileContext);
  if (!context) {
    throw new Error('useMasterProfile must be used within a MasterProfileProvider');
  }
  return context;
};
