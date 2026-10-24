import React, { useRef, useState, useEffect } from 'react';
import type { ResolvedResumeData } from '../../types/v2';
import { getTemplate } from '../templates/TemplateRegistry';
import { WatermarkOverlay } from './WatermarkOverlay';

export type PaperSize = 'a4' | 'letter';

interface PaperPreviewProps {
  data: ResolvedResumeData;
  templateId: string;
  primaryColor: string;
  fontFamily: string;
  paperSize?: PaperSize;
  zoom?: number;
  sectionOrder?: string[];
  showWatermark?: boolean;
}

export const PaperPreview: React.FC<PaperPreviewProps> = ({
  data,
  templateId = 'minimal-ats',
  primaryColor = '#111827',
  fontFamily = 'Inter',
  paperSize = 'a4',
  zoom = 1.0,
  sectionOrder,
  showWatermark = true,
}) => {
  const template = getTemplate(templateId);
  const TemplateComponent = template.component;

  const sheetRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Paper Dimensions:
  // A4: 210mm x 297mm (794px x 1123px @ 96 DPI)
  // Letter: 8.5in x 11in (816px x 1056px @ 96 DPI)
  const isLetter = paperSize === 'letter';
  const paperWidth = isLetter ? 816 : 794;
  const pageHeight = isLetter ? 1056 : 1123;

  // Measure content height with ResizeObserver
  useEffect(() => {
    if (!sheetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === sheetRef.current) {
          setContentHeight(sheetRef.current.scrollHeight);
        }
      }
    });

    observer.observe(sheetRef.current);
    setContentHeight(sheetRef.current.scrollHeight);

    return () => {
      observer.disconnect();
    };
  }, [data, templateId, paperSize]);

  // Fit guidance calculation
  const rawPages = contentHeight > 0 ? contentHeight / pageHeight : 1.0;
  const pageCountFormatted = Math.max(1, Math.round(rawPages * 10) / 10);

  let fitStatus: { text: string; statusClass: 'optimal' | 'warning' | 'multipage' } = {
    text: '1.0 Page (Optimal)',
    statusClass: 'optimal',
  };

  if (rawPages > 1.05 && rawPages <= 1.35) {
    fitStatus = {
      text: `${pageCountFormatted} Pages (Overflow Warning)`,
      statusClass: 'warning',
    };
  } else if (rawPages > 1.35) {
    fitStatus = {
      text: `${pageCountFormatted} Pages (Multi-page)`,
      statusClass: 'multipage',
    };
  }

  // Calculate virtual page break lines
  const totalPagesNeeded = Math.ceil(Math.max(1, rawPages));
  const breakLineOffsets: number[] = [];
  for (let p = 1; p < totalPagesNeeded; p++) {
    breakLineOffsets.push(p * pageHeight);
  }

  return (
    <div className="paper-canvas-viewport">
      {/* Fit Guidance Pill Overlay */}
      <div className="fit-guidance-bar">
        <span className={`fit-pill ${fitStatus.statusClass}`}>
          {fitStatus.text}
        </span>
      </div>

      <div
        className="paper-transform-wrapper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          ref={sheetRef}
          className="paper-sheet"
          style={{
            width: `${paperWidth}px`,
            minHeight: `${pageHeight}px`,
            background: '#ffffff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            borderRadius: '2px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Virtual Page Break Lines */}
          {breakLineOffsets.map((offset) => (
            <div
              key={offset}
              className="virtual-page-break"
              style={{ top: `${offset}px` }}
            >
              <div className="page-break-tag">Page Break (Estimate)</div>
            </div>
          ))}

          {/* Template Content */}
          <TemplateComponent
            data={data}
            primaryColor={primaryColor}
            fontFamily={fontFamily}
            sectionOrder={sectionOrder}
          />

          {/* Watermark Overlay for free tier */}
          <WatermarkOverlay visible={showWatermark} />
        </div>
      </div>

      <style>{`
        .paper-canvas-viewport {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: auto;
          padding: 44px 16px 80px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--bg-hover, #f1f5f9);
          position: relative;
        }
        .fit-guidance-bar {
          position: sticky;
          top: -30px;
          z-index: 15;
          margin-bottom: 12px;
          pointer-events: none;
        }
        .fit-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: var(--shadow-sm);
        }
        .fit-pill.optimal {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .fit-pill.warning {
          background: #fef9c3;
          color: #a16207;
          border: 1px solid #fde047;
        }
        .fit-pill.multipage {
          background: #e0e7ff;
          color: #4338ca;
          border: 1px solid #a5b4fc;
        }
        .paper-transform-wrapper {
          display: flex;
          justify-content: center;
          min-width: 100%;
        }
        .virtual-page-break {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          border-top: 2px dashed rgba(239, 68, 68, 0.4);
          pointer-events: none;
          z-index: 10;
        }
        .page-break-tag {
          position: absolute;
          right: 12px;
          top: -10px;
          background: rgba(239, 68, 68, 0.15);
          color: #b91c1c;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};
