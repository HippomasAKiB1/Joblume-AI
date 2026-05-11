import React, { useState } from 'react';
import { X, Lock, CheckCircle2, ExternalLink, Link2, Globe } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'pro' | 'enterprise';
}

export default function UpgradeModal({ isOpen, onClose, plan }: UpgradeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();

  if (!isOpen) return null;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      await userAPI.upgradeSubscription(code);
      toast.success('CONGRATS! You upgraded successfully to Pro!', { icon: '🎉', duration: 5000 });
      await refreshUser();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Wrong code! Try asking Akib again.";
      toast.error(msg, { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal animate-scale-in" onClick={e => e.stopPropagation()} style={{maxWidth: '550px'}}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="upgrade-header">
          <div className="icon-soft" style={{width:'60px', height:'60px', margin:'0 auto var(--space-4)'}}>
            {plan === 'pro' ? <Lock size={32} /> : <Globe size={32} />}
          </div>
          <h2>{plan === 'pro' ? 'Unlock JobLume AI Pro' : 'Enterprise Access'}</h2>
          <p className="text-secondary">
            {plan === 'pro' 
              ? 'Ready to elevate your career? Grab your unique activation code below.' 
              : 'Enterprise solutions are managed via direct commercial licensing.'}
          </p>
        </div>

        <div className="developer-contact-card">
          <div style={{display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-4)'}}>
            <div className="dev-avatar">AH</div>
            <div>
              <div style={{fontWeight:600, color:'var(--text-primary)'}}>Akib Hasan</div>
              <div style={{fontSize:'var(--text-xs)', color:'var(--text-tertiary)'}}>Platform Creator</div>
            </div>
          </div>
          <p style={{fontSize:'var(--text-sm)', marginBottom:'var(--space-4)', color:'var(--text-secondary)', lineHeight:'1.6'}}>
            👋 Hey! Since JobLume isn't a big evil corporation yet, subscriptions are managed by me personally. Send me a message and I'll give you your secret unlock code.
          </p>
          <div className="dev-social-links">
            <a href="https://akibhasan.me" target="_blank" rel="noreferrer" className="social-chip"><Globe size={14} /> Website</a>
            <a href="https://github.com/HippomasAKiB1" target="_blank" rel="noreferrer" className="social-chip"><ExternalLink size={14} /> GitHub</a>
            <a href="https://www.linkedin.com/in/akib-hasan-pyil/" target="_blank" rel="noreferrer" className="social-chip"><Link2 size={14} /> LinkedIn</a>
            <a href="https://www.facebook.com/HippomasAKiB" target="_blank" rel="noreferrer" className="social-chip"><ExternalLink size={14} /> Facebook</a>
          </div>
        </div>

        {plan === 'pro' ? (
          <form className="activation-form" onSubmit={handleUpgrade}>
            <div className="input-group">
              <label>Have a code?</label>
              <div style={{display:'flex', gap:'var(--space-2)'}}>
                <input 
                  className="input" 
                  placeholder="Enter Activation Code..." 
                  value={code} 
                  onChange={e => setCode(e.target.value)}
                  disabled={isLoading}
                />
                <button className="btn btn-primary" type="submit" disabled={isLoading || !code.trim()}>
                  {isLoading ? 'Checking...' : 'Activate Pro'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{textAlign:'center', padding:'var(--space-4) 0'}}>
            <div className="badge badge-warning" style={{fontSize:'var(--text-sm)', padding:'6px 12px'}}>Enterprise Feature Currently Unavailable</div>
            <p style={{fontSize:'var(--text-sm)', color:'var(--text-secondary)', marginTop:'var(--space-3)'}}>Please reach out via LinkedIn for commercial API integrations.</p>
          </div>
        )}

        <style>{`
          .upgrade-modal { padding: var(--space-8); }
          .upgrade-header { text-align: center; margin-bottom: var(--space-6); }
          .upgrade-header h2 { font-family: var(--font-serif); font-size: var(--text-2xl); margin-bottom: var(--space-1); color: var(--text-primary); }
          
          .developer-contact-card {
            background: var(--bg-tertiary);
            border-radius: var(--radius-lg);
            padding: var(--space-5);
            margin-bottom: var(--space-6);
            border: 1px solid var(--border-light);
          }
          .dev-avatar {
            width: 40px; height: 40px; border-radius: var(--radius-full);
            background: var(--primary); color: white; font-family: var(--font-serif);
            display: flex; align-items: center; justify-content: center; font-weight: bold;
          }
          .dev-social-links { display: flex; flex-wrap: wrap; gap: var(--space-2); }
          .social-chip {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 12px; background: var(--bg-secondary);
            border: 1px solid var(--border-light); border-radius: var(--radius-full);
            font-size: var(--text-xs); color: var(--text-secondary);
            text-decoration: none; transition: all var(--transition-fast);
          }
          .social-chip:hover {
            background: var(--bg-elevated); border-color: var(--primary); color: var(--primary);
            transform: translateY(-1px);
          }
          .activation-form { border-top: 1px solid var(--border-light); padding-top: var(--space-6); }
        `}</style>
      </div>
    </div>
  );
}
