import { Sparkles, Globe, ExternalLink, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-lg">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="brand-icon"><Sparkles size={20} /></div>
              <span className="brand-text">JobLume<span className="brand-ai">AI</span></span>
            </div>
            <p className="footer-desc">AI-powered resume builder and job application optimizer. Land your dream job faster.</p>
            <div className="footer-socials">
              <a href="https://www.facebook.com/HippomasAKiB" target="_blank" rel="noreferrer" aria-label="Facebook"><ExternalLink size={18} /></a>
              <a href="https://www.linkedin.com/in/akib-hasan-pyil/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Link2 size={18} /></a>
              <a href="https://github.com/HippomasAKiB1" target="_blank" rel="noreferrer" aria-label="GitHub"><Globe size={18} /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/dashboard/templates">Templates</Link>
            <Link to="/dashboard/ats-scanner">ATS Scanner</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Blog</a>
            <a href="#">Career Tips</a>
            <a href="#">Help Center</a>
            <a href="#">API Docs</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} JobLume AI. All rights reserved.</p>
          <p className="developer-credit">Developed by <a href="https://github.com/HippomasAKiB1" target="_blank" rel="noreferrer">AKiB</a></p>
        </div>
      </div>
    </footer>
  );
}
