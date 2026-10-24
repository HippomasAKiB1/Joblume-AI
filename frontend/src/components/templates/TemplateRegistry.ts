import React from 'react';
import type { ResolvedResumeData } from '../../types/v2';
import { MinimalAtsTemplate } from './MinimalAtsTemplate';
import { ModernProfessionalTemplate } from './ModernProfessionalTemplate';

export interface TemplateProps {
  data: ResolvedResumeData;
  primaryColor: string;
  fontFamily: string;
  sectionOrder?: string[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnailUrl?: string;
  component: React.ComponentType<TemplateProps>;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  'minimal-ats': {
    id: 'minimal-ats',
    name: 'Minimal ATS',
    description: 'Clean, high-legibility ATS-optimized layout with zero non-standard elements.',
    tags: ['ATS-Optimized', 'Minimal', 'Tech', 'Corporate'],
    component: MinimalAtsTemplate,
  },
  'modern-professional': {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Distinctive accent-bar header with clean, contemporary typography and structured layout.',
    tags: ['Professional', 'Modern', 'Executive', 'Creative'],
    component: ModernProfessionalTemplate,
  },
};

export const DEFAULT_TEMPLATE_ID = 'minimal-ats';

export function getTemplate(id?: string): TemplateDefinition {
  if (id && TEMPLATE_REGISTRY[id]) {
    return TEMPLATE_REGISTRY[id];
  }
  return TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}
