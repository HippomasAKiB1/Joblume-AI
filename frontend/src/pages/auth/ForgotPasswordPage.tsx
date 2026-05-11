import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success('If an account exists, a reset link has been sent.');
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
          <p>Enter your email to receive a reset link</p>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input id="email" type="email" className="input input-with-icon" placeholder="akib@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full">Send Reset Link</button>
          </form>
        ) : (
          <div className="auth-success">
            <p>Check your inbox for a password reset link.</p>
          </div>
        )}
        <p className="auth-footer-text">
          <Link to="/login" className="auth-link"><ArrowLeft size={14} /> Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
