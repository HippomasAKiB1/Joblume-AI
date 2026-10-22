import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-secondary, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '24px',
          }}
        >
          ⚠️
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Something went wrong
        </h2>
        <p
          style={{
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
          }}
        >
          An unexpected error occurred. Our team has been notified. Please try refreshing the page.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 500,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
          {resetError && (
            <button
              type="button"
              onClick={resetError}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary, #94a3b8)',
                fontWeight: 500,
                fontSize: '0.95rem',
                border: '1px solid var(--border-color, #334155)',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
