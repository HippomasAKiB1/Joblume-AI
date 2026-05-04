import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner container-lg">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon"><Sparkles size={22} /></div>
          <span className="brand-text">JobLume<span className="brand-ai">AI</span></span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/#features" className="nav-link" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link to="/#pricing" className="nav-link" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link to="/#testimonials" className="nav-link" onClick={() => setMobileOpen(false)}>Testimonials</Link>
        </div>

        <div className="navbar-actions">
          <button className="btn-icon btn-ghost theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Log In</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}

          <button className="btn-icon btn-ghost mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
