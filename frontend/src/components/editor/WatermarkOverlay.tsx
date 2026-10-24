import React from 'react';
import { Sparkles } from 'lucide-react';

interface WatermarkOverlayProps {
  visible?: boolean;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <div className="watermark-overlay" aria-hidden="true">
      <div className="watermark-badge">
        <Sparkles size={11} className="watermark-icon" />
        <span>Made with JobLume AI</span>
      </div>

      <style>{`
        .watermark-overlay {
          position: absolute;
          bottom: 16px;
          right: 20px;
          pointer-events: none;
          z-index: 20;
          user-select: none;
        }
        .watermark-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.12);
          color: rgba(15, 23, 42, 0.35);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          backdrop-filter: blur(2px);
        }
        .watermark-icon {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};
