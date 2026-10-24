import React from 'react';
import type { PersonalInfo } from '../../types/v2';
import { User, Mail, Phone, MapPin, Globe, Share2, Code2, Briefcase } from 'lucide-react';

interface Props {
  data: PersonalInfo;
  onChange: (data: Partial<PersonalInfo>) => void;
}

export const PersonalInfoSection: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="profile-section-body">
      <div className="grid-2-col">
        <div className="input-group">
          <label><User size={14} /> Full Name</label>
          <input
            className="input"
            value={data.fullName || ''}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="e.g. Alex Morgan"
          />
        </div>
        <div className="input-group">
          <label><Mail size={14} /> Email</label>
          <input
            className="input"
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="alex.morgan@example.com"
          />
        </div>
      </div>

      <div className="grid-2-col">
        <div className="input-group">
          <label><Phone size={14} /> Phone</label>
          <input
            className="input"
            value={data.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 019-2834"
          />
        </div>
        <div className="input-group">
          <label><MapPin size={14} /> Location</label>
          <input
            className="input"
            value={data.location || ''}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="San Francisco, CA"
          />
        </div>
      </div>

      <div className="grid-2-col">
        <div className="input-group">
          <label><Globe size={14} /> Website / Portfolio URL</label>
          <input
            className="input"
            value={data.website || ''}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://alexmorgan.dev"
          />
        </div>
        <div className="input-group">
          <label><Share2 size={14} /> LinkedIn URL</label>
          <input
            className="input"
            value={data.linkedin || ''}
            onChange={(e) => onChange({ linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/alexmorgan"
          />
        </div>
      </div>

      <div className="grid-2-col">
        <div className="input-group">
          <label><Code2 size={14} /> GitHub URL</label>
          <input
            className="input"
            value={data.github || ''}
            onChange={(e) => onChange({ github: e.target.value })}
            placeholder="https://github.com/alexmorgan"
          />
        </div>
        <div className="input-group">
          <label><Briefcase size={14} /> Additional Portfolio Link</label>
          <input
            className="input"
            value={data.portfolio || ''}
            onChange={(e) => onChange({ portfolio: e.target.value })}
            placeholder="https://dribbble.com/alexmorgan"
          />
        </div>
      </div>
    </div>
  );
};
