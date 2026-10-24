import React from 'react';
import { AlignLeft } from 'lucide-react';

interface Props {
  summary: string;
  onChange: (summary: string) => void;
}

export const SummarySection: React.FC<Props> = ({ summary, onChange }) => {
  return (
    <div className="profile-section-body">
      <div className="input-group">
        <label>
          <AlignLeft size={14} /> Professional Career Bank Summary
        </label>
        <p className="input-hint">
          Provide your master overview. Individual resumes can import this text directly or override it inline.
        </p>
        <textarea
          className="input"
          rows={5}
          value={summary || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven Senior Full Stack Engineer with 7+ years of experience architecting distributed cloud systems..."
        />
      </div>
    </div>
  );
};
