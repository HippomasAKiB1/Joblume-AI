import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { User as UserIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile({ full_name: fullName, email });
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="dash-header"><h1 className="dash-title">Profile</h1><p className="dash-subtitle">Manage your account information</p></div>
      <div className="card" style={{maxWidth:600}}>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-5)',marginBottom:'var(--space-8)'}}>
          <div className="user-avatar" style={{width:64,height:64,fontSize:'var(--text-2xl)'}}>{user?.full_name?.charAt(0)?.toUpperCase()}</div>
          <div><h2 style={{fontWeight:700}}>{user?.full_name}</h2><p style={{fontSize:'var(--text-sm)',color:'var(--text-tertiary)'}}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-5)'}}>
          <div className="input-group"><label>Full Name</label><input className="input" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div className="input-group"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{alignSelf:'flex-start'}}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}
