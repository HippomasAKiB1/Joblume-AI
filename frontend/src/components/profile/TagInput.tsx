import React, { useState, KeyboardEvent } from 'react';
import { Tag, X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add tag...',
  size = 'sm',
}) => {
  const [inputVal, setInputVal] = useState('');

  const addTag = (rawTag: string) => {
    const clean = rawTag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className={`tag-input-container tag-${size}`}>
      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">
            <Tag size={12} className="tag-icon" />
            <span className="tag-label">{tag}</span>
            <button
              type="button"
              className="tag-remove-btn"
              onClick={() => removeTag(tag)}
              title={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="tag-add-inline">
          <input
            type="text"
            className="tag-text-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputVal.trim()) addTag(inputVal);
            }}
            placeholder={tags.length === 0 ? placeholder : '+ tag'}
          />
        </div>
      </div>

      <style>{`
        .tag-input-container {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          min-height: 38px;
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          width: 100%;
        }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--bg-elevated, #f1f5f9);
          border: 1px solid var(--border-light, #cbd5e1);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }
        .tag-icon {
          color: var(--primary, #4f46e5);
          opacity: 0.8;
        }
        .tag-remove-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary, #64748b);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          border-radius: 50%;
        }
        .tag-remove-btn:hover {
          color: var(--danger, #ef4444);
        }
        .tag-add-inline {
          flex: 1;
          min-width: 80px;
        }
        .tag-text-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 12px;
          color: var(--text-primary, #1e293b);
        }
        .tag-text-input::placeholder {
          color: var(--text-tertiary, #94a3b8);
        }
      `}</style>
    </div>
  );
};
