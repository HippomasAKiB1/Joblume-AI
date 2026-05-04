import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="dash-header"><h1 className="dash-title">Settings</h1><p className="dash-subtitle">Customize your JobLume AI experience</p></div>

      <div className="settings-sections">
        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:'var(--space-5)'}}>Appearance</h3>
          <p style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',marginBottom:'var(--space-5)'}}>Choose your preferred theme</p>
          <div style={{display:'flex',gap:'var(--space-3)'}}>
            <button className={`btn ${theme==='light'?'btn-primary':'btn-secondary'}`} onClick={() => setTheme('light')}><Sun size={16}/> Light</button>
            <button className={`btn ${theme==='dark'?'btn-primary':'btn-secondary'}`} onClick={() => setTheme('dark')}><Moon size={16}/> Dark</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:'var(--space-5)'}}>Export Settings</h3>
          <p style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',marginBottom:'var(--space-5)'}}>Default export format for resumes</p>
          <div style={{display:'flex',gap:'var(--space-3)'}}>
            <button className="btn btn-secondary">PDF (Default)</button>
            <button className="btn btn-secondary">DOCX</button>
          </div>
        </div>

        <div className="card" style={{borderColor:'var(--danger)'}}>
          <h3 style={{fontWeight:700,marginBottom:'var(--space-5)',color:'var(--danger)'}}>Danger Zone</h3>
          <p style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',marginBottom:'var(--space-5)'}}>Irreversible actions. Please be careful.</p>
          <button className="btn btn-danger" onClick={() => { if (confirm('Are you sure you want to log out?')) { logout(); } }}>Log Out</button>
        </div>
      </div>

      <style>{`
        .settings-sections { display: flex; flex-direction: column; gap: var(--space-5); max-width: 600px; }
      `}</style>
    </div>
  );
}
