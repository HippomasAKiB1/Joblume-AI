import React from 'react';
import { getContrastRatio, isWcagCompliant, suggestDarkerVariant } from '../../utils/contrast';
import { Palette, Type, Layout, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react';

interface ThemeSelectorProps {
  templateId: string;
  fontFamily: string;
  primaryColor: string;
  onTemplateChange: (templateId: string) => void;
  onFontChange: (fontFamily: string) => void;
  onColorChange: (color: string) => void;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter (Modern Sans-Serif)' },
  { value: 'Helvetica', label: 'Helvetica / Arial (Standard Sans)' },
  { value: 'Calibri', label: 'Calibri (Corporate Sans)' },
  { value: 'Georgia', label: 'Georgia (Classic Editorial Serif)' },
  { value: 'Times New Roman', label: 'Times New Roman (Traditional Serif)' },
];

const colorSwatches = [
  { name: 'Midnight Charcoal', hex: '#111827' },
  { name: 'Classic Navy', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo Accent', hex: '#4f46e5' },
  { name: 'Emerald Slate', hex: '#059669' },
  { name: 'Burgundy', hex: '#881337' },
  { name: 'Low-Contrast Amber (Warning Test)', hex: '#fbbf24' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  templateId,
  fontFamily,
  primaryColor,
  onTemplateChange,
  onFontChange,
  onColorChange,
}) => {
  const contrastRatio = getContrastRatio(primaryColor, '#ffffff');
  const isCompliant = isWcagCompliant(primaryColor, '#ffffff');

  const handleSuggestColor = () => {
    const compliant = suggestDarkerVariant(primaryColor);
    onColorChange(compliant);
  };

  return (
    <div className="theme-selector-container">
      {/* Template Selection */}
      <div className="input-group">
        <label><Layout size={14} /> Resume Template</label>
        <select
          className="input"
          value={templateId}
          onChange={(e) => onTemplateChange(e.target.value)}
        >
          <option value="minimal-ats">Minimal ATS (Single Column, High Legibility)</option>
          <option value="modern-professional">Modern Professional (Accent Header Banner)</option>
        </select>
      </div>

      {/* Font Family Selection */}
      <div className="input-group">
        <label><Type size={14} /> Font Typography</label>
        <select
          className="input"
          value={fontFamily}
          onChange={(e) => onFontChange(e.target.value)}
        >
          {fontOptions.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Primary Color Picker */}
      <div className="input-group">
        <label><Palette size={14} /> Primary Accent Color</label>
        <div className="color-picker-row">
          <input
            type="color"
            className="color-picker-input"
            value={primaryColor.startsWith('#') ? primaryColor : '#111827'}
            onChange={(e) => onColorChange(e.target.value)}
            title="Pick custom color"
          />
          <input
            type="text"
            className="input color-hex-input"
            value={primaryColor}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#111827"
          />
        </div>

        {/* Preset Color Swatches */}
        <div className="swatches-grid">
          {colorSwatches.map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              className={`swatch-btn ${primaryColor.toLowerCase() === swatch.hex.toLowerCase() ? 'is-active' : ''}`}
              style={{ backgroundColor: swatch.hex }}
              onClick={() => onColorChange(swatch.hex)}
              title={`${swatch.name} (${swatch.hex})`}
            />
          ))}
        </div>
      </div>

      {/* WCAG Contrast Guard */}
      <div className={`contrast-guard-card ${isCompliant ? 'pass' : 'fail'}`}>
        <div className="contrast-header">
          {isCompliant ? (
            <div className="contrast-status pass">
              <CheckCircle2 size={16} />
              <span>{contrastRatio}:1 (WCAG AA Pass)</span>
            </div>
          ) : (
            <div className="contrast-status fail">
              <AlertTriangle size={16} />
              <span>{contrastRatio}:1 Low Contrast Warning</span>
            </div>
          )}
        </div>

        <p className="contrast-desc">
          {isCompliant
            ? 'This accent color meets WCAG AA readability standards against white resume paper.'
            : 'This color may be difficult for recruiters to read against white resume paper.'}
        </p>

        {!isCompliant && (
          <button
            type="button"
            className="btn btn-secondary btn-sm suggest-btn"
            onClick={handleSuggestColor}
          >
            <Wand2 size={13} /> Suggest Darker Compliant Variant
          </button>
        )}
      </div>

      <style>{`
        .theme-selector-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .color-picker-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .color-picker-input {
          width: 42px;
          height: 38px;
          padding: 2px;
          border: 1px solid var(--border-light, #cbd5e1);
          border-radius: var(--radius-sm, 4px);
          cursor: pointer;
          background: transparent;
        }
        .color-hex-input {
          max-width: 140px;
          font-family: monospace;
          font-weight: 600;
        }
        .swatches-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .swatch-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px var(--border-light, #cbd5e1);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .swatch-btn:hover {
          transform: scale(1.15);
        }
        .swatch-btn.is-active {
          box-shadow: 0 0 0 2px var(--primary, #4f46e5);
          transform: scale(1.1);
        }
        .contrast-guard-card {
          padding: 12px 14px;
          border-radius: var(--radius-md, 8px);
          border: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-hover, #f8fafc);
        }
        .contrast-guard-card.pass {
          border-color: #86efac;
          background: #f0fdf4;
        }
        .contrast-guard-card.fail {
          border-color: #fde047;
          background: #fefce8;
        }
        .contrast-header {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .contrast-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
        }
        .contrast-status.pass {
          color: #15803d;
        }
        .contrast-status.fail {
          color: #a16207;
        }
        .contrast-desc {
          font-size: 11.5px;
          color: #4b5563;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }
        .suggest-btn {
          font-size: 12px;
          padding: 4px 10px;
          background: #ffffff;
          border-color: #ca8a04;
          color: #854d0e;
        }
        .suggest-btn:hover {
          background: #fef9c3;
        }
      `}</style>
    </div>
  );
};
