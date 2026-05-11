import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { AdminStats, AdminUserInfo } from '../../types';
import { Users, FileText, Briefcase, Mail, ShieldAlert, AlertCircle, CheckCircle, Search, Clock, Settings, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sRes, uRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.listUsers()
        ]);
        setStats(sRes.data);
        setUsers(uRes.data);
      } catch (err) {
        toast.error("Security Check: Failed to harvest environment telemetry.");
        navigate('/akib-admin');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = () => {
    logout();
    navigate('/akib-admin');
  };

  if (loading && !stats) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
        <div style={{textAlign: 'center'}}>
          <div className="spinner spinner-lg" style={{margin: '0 auto 20px'}} />
          <p style={{letterSpacing: '0.1em', opacity: 0.7, fontSize: 'var(--text-sm)'}}>SYNCHRONIZING DATASTREAMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 'var(--space-8)'}}>
      
      {/* Top Utility Bar */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-10)'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', marginBottom: '4px'}}>
            <ShieldAlert size={24} />
            <span style={{fontWeight: 800, letterSpacing: '0.15em', fontSize: 'var(--text-sm)'}}>SYSTEM MASTER ARCHIVE</span>
          </div>
          <h1 style={{fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'var(--text-4xl)', letterSpacing: '-0.02em'}}>Command Center</h1>
        </div>

        <div style={{display: 'flex', gap: '12px'}}>
          <div style={{textAlign: 'right', marginRight: '12px'}}>
            <div style={{fontSize: 'var(--text-sm)', fontWeight: 600}}>{user?.full_name}</div>
            <div style={{fontSize: 'var(--text-xs)', color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em'}}>OVERSEER</div>
          </div>
          <button onClick={handleSignOut} className="btn btn-secondary" style={{borderColor: 'var(--border-medium)'}}>
            <LogOut size={16} /> Exit
          </button>
        </div>
      </div>

      {/* System Analytics */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)'}}>
        <div className="card" style={{background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'white'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <p style={{fontSize: 'var(--text-xs)', opacity: 0.8, fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px'}}>TOTAL ACCOUNTS</p>
              <h2 style={{fontSize: 'var(--text-4xl)', fontWeight: 800}}>{stats?.total_users || 0}</h2>
            </div>
            <div style={{background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: 'var(--radius-md)'}}><Users size={24} /></div>
          </div>
        </div>

        <div className="card" style={{background: 'var(--bg-elevated)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <p style={{fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px'}}>ENGAGED RESUMES</p>
              <h2 style={{fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)'}}>{stats?.total_resumes || 0}</h2>
            </div>
            <div style={{background: 'var(--primary-soft)', color: 'var(--primary)', padding: '10px', borderRadius: 'var(--radius-md)'}}><FileText size={24} /></div>
          </div>
        </div>

        <div className="card" style={{background: 'var(--bg-elevated)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <p style={{fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px'}}>APPLICATION LOADS</p>
              <h2 style={{fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)'}}>{stats?.total_applications || 0}</h2>
            </div>
            <div style={{background: 'var(--success-soft)', color: 'var(--success)', padding: '10px', borderRadius: 'var(--radius-md)'}}><Briefcase size={24} /></div>
          </div>
        </div>

        <div className="card" style={{background: 'var(--bg-elevated)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <p style={{fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px'}}>CORRESPONDENCE</p>
              <h2 style={{fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)'}}>{stats?.total_cover_letters || 0}</h2>
            </div>
            <div style={{background: 'var(--accent-soft)', color: 'var(--accent)', padding: '10px', borderRadius: 'var(--radius-md)'}}><Mail size={24} /></div>
          </div>
        </div>
      </div>

      {/* User Manifest Table */}
      <div className="card" style={{background: 'var(--bg-elevated)', padding: 0, overflow: 'hidden'}}>
        <div style={{padding: 'var(--space-6)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'}}>
          <h3 style={{fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--font-sans)'}}>System User Manifest</h3>
          
          <div className="input-icon-wrapper" style={{maxWidth: '300px', width: '100%'}}>
            <Search size={16} className="input-icon" />
            <input 
              type="text" 
              className="input input-with-icon" 
              placeholder="Locate identities..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{background: 'var(--bg-tertiary)', border: 'none'}}
            />
          </div>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{background: 'var(--bg-tertiary)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                <th style={{padding: '16px 24px'}}>Identity</th>
                <th style={{padding: '16px 24px'}}>Auth Level</th>
                <th style={{padding: '16px 24px'}}>Subscription</th>
                <th style={{padding: '16px 24px', textAlign: 'center'}}>Resume Artifacts</th>
                <th style={{padding: '16px 24px', textAlign: 'center'}}>Traces</th>
                <th style={{padding: '16px 24px'}}>Timestamp</th>
              </tr>
            </thead>
            <tbody style={{fontSize: 'var(--text-sm)'}}>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s'}} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{padding: '20px 24px'}}>
                    <div style={{fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px'}}>{u.full_name}</div>
                    <div style={{fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px'}}><Mail size={12} />{u.email}</div>
                  </td>
                  <td style={{padding: '20px 24px'}}>
                    {u.is_admin ? (
                      <span className="badge" style={{background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)'}}><ShieldAlert size={12} /> SUPERVISOR</span>
                    ) : (
                      <span className="badge badge-info">STANDARD</span>
                    )}
                  </td>
                  <td style={{padding: '20px 24px'}}>
                    <span className={`badge ${u.subscription_tier === 'premium' ? 'badge-success' : 'badge-primary'}`} style={{textTransform: 'uppercase'}}>{u.subscription_tier}</span>
                  </td>
                  <td style={{padding: '20px 24px', textAlign: 'center', fontWeight: 700, color: u.resume_count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'}}>
                    {u.resume_count}
                  </td>
                  <td style={{padding: '20px 24px', textAlign: 'center', fontWeight: 700, color: u.application_count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'}}>
                    {u.application_count}
                  </td>
                  <td style={{padding: '20px 24px', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <Clock size={12} />
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)'}}>
                    <AlertCircle size={32} style={{margin: '0 auto 12px', opacity: 0.5}} />
                    <p>No matching registries identified.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
