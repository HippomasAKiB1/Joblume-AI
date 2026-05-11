import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(fullName, email, password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        {/* Subtle grid texture handled globally by body noise filter */}
      </div>
      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <div className="brand-icon"><Sparkles size={20} /></div>
            <span className="brand-text">JobLume<span className="brand-ai">AI</span></span>
          </Link>
          <h1>Start your application.</h1>
          <p>Craft a career-defining resume with precision tools.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input id="fullName" type="text" className="input input-with-icon" placeholder="John Doe"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input id="email" type="email" className="input input-with-icon" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input id="password" type="password" className="input input-with-icon" placeholder="Min 6 characters"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" /> : <>Begin Building <ArrowRight size={18} strokeWidth={1.5} /></>}
          </button>
        </form>
        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
