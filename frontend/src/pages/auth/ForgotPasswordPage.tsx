import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
    } catch {
      // Intentionally absorb errors to preserve enumeration defense
    } finally {
      setLoading(false);
      setSubmitted(true);
      toast.success('If an account exists with that email, a reset link has been sent.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb orb-a" /><div className="auth-orb orb-b" /></div>
      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <div className="brand-icon"><Sparkles size={20} /></div>
            <span className="brand-text">JobLume<span className="brand-ai">AI</span></span>
          </Link>
          <h1>Reset Password</h1>
          <p>Enter your account email to receive a recovery link.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input input-with-icon"
                  placeholder="akib@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="auth-success" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              If an account exists for <strong>{email}</strong>, we have dispatched a password reset link. Please check your inbox and spam folder.
            </p>
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => { setSubmitted(false); setEmail(''); }}
            >
              Try another email
            </button>
          </div>
        )}

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link"><ArrowLeft size={14} /> Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
