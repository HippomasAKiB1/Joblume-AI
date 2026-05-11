import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from './UpgradeModal';

interface SubscriptionGateProps {
  children: React.ReactNode;
  title?: string;
}

export default function SubscriptionGate({ children, title = "Pro Feature" }: SubscriptionGateProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isPro = user?.subscription_tier === 'pro';

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="subscription-gate-wrapper">
      {/* Background preview content rendered non-interactively & blurred */}
      <div className="content-blur">
        {children}
      </div>

      {/* The interactive overlay locking state */}
      <div className="lock-overlay">
        <div className="lock-card animate-scale-in">
          <div className="icon-soft" style={{marginBottom: 'var(--space-4)'}}>
            <Lock size={28} />
          </div>
          <h2>{title}</h2>
          <p>This professional tool is locked on the Free tier. Elevate your account to access unlimited tailoring and tracking.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setIsModalOpen(true)}>
            Upgrade to JobLume Pro
          </button>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        plan="pro" 
      />

      <style>{`
        .subscription-gate-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 400px;
          overflow: hidden;
          border-radius: var(--radius-xl);
        }
        .content-blur {
          filter: blur(8px) opacity(0.5);
          pointer-events: none;
          user-select: none;
          transform: scale(0.98);
          transition: all 0.3s ease;
        }
        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: saturate(180%) blur(4px);
        }
        [data-theme="dark"] .lock-overlay {
          background: rgba(0, 0, 0, 0.4);
        }
        .lock-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-light);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          text-align: center;
          max-width: 420px;
          margin: var(--space-4);
        }
        .lock-card h2 {
          font-family: var(--font-serif);
          font-size: var(--text-2xl);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }
        .lock-card p {
          color: var(--text-secondary);
          margin-bottom: var(--space-6);
          line-height: 1.6;
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
}
