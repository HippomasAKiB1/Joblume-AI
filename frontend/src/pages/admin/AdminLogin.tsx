import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import '../auth/Auth.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Protect from double auth loops
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Log into the backend system using flexible identifier schema
      await login(username, password);
      
      // Fetch immediate next tick value or wait for system hook
      // Since context update triggers downstream, we defer a verification check
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Administrative access failed.');
      setLoading(false);
    }
  };

  // Secondary check: once the 'user' state populates, evaluate admin privileges
  useEffect(() => {
    if (loading && isAuthenticated && user) {
      if (user.is_admin) {
        toast.success('Identity Confirmed. Launching Nexus...');
        navigate('/dashboard/admin');
        setLoading(false);
      } else {
        toast.error('Revoked. Unauthorized personnel detected.');
        logout(); // Immediately strip standard token access
        setLoading(false);
      }
    }
  }, [isAuthenticated, user, loading, logout, navigate]);

  return (
    <div className="auth-page" style={{background: '#050505'}}>
      <div className="auth-container animate-scale-in" style={{borderColor: 'var(--border-medium)', background: 'var(--bg-primary)'}}>
        <div className="auth-header">
          <div className="auth-brand">
            <div className="brand-icon" style={{background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: 'white'}}><ShieldAlert size={20} /></div>
            <span className="brand-text" style={{letterSpacing: '0.1em'}}>ADMIN<span style={{color: '#ef4444'}}>ACCESS</span></span>
          </div>
          <h1 style={{fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Secure Portal</h1>
          <p>Authorized personnel only. All access logs tracked.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username">Master Username</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input id="username" type="text" className="input input-with-icon" placeholder="Identifier"
                style={{background: 'var(--bg-elevated)', borderColor: 'var(--border-medium)'}}
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="password">Credentials</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input id="password" type="password" className="input input-with-icon" placeholder="••••••••"
                style={{background: 'var(--bg-elevated)', borderColor: 'var(--border-medium)'}}
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <div style={{marginTop: '10px'}}></div>
          
          <button type="submit" className="btn btn-lg w-full" disabled={loading}
            style={{background: '#ef4444', color: 'white', border: 'none', fontWeight: 700}}>
            {loading ? <div className="spinner" style={{borderTopColor: 'white'}} /> : <>Establish Session <ArrowRight size={18} strokeWidth={2} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
