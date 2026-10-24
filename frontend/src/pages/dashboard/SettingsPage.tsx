import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { Sun, Moon, Save, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      await userAPI.updateProfile({ full_name: fullName, email });
      toast.success('Account profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Account update failed');
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dash-header">
        <h1 className="dash-title">Account & Settings</h1>
        <p className="dash-subtitle">Manage your personal credentials, appearance, and workspace preferences</p>
      </div>

      <div className="settings-sections">
        {/* Account Information Card (absorbed from old ProfilePage) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 'var(--text-xl)' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{user?.full_name}</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} • Tier: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user?.subscription_tier}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveAccount}
              disabled={savingAccount}
              style={{ alignSelf: 'flex-start' }}
            >
              <Save size={16} /> {savingAccount ? 'Saving...' : 'Save Account Changes'}
            </button>
          </div>
        </div>

        {/* Theme & Appearance */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Appearance</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Choose your preferred theme interface
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={16} /> Light
            </button>
            <button
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>

        {/* Export Settings */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Export Defaults</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Default export format for resume downloads
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary">PDF (Default)</button>
            <button className="btn btn-secondary">DOCX</button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-sections { display: flex; flex-direction: column; gap: var(--space-5); max-width: 650px; }
      `}</style>
    </div>
  );
}
