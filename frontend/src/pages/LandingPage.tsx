import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  Sparkles, FileText, Wand2, ScanSearch, Mail, ClipboardList,
  Target, Zap, Shield, ArrowRight, Star, Check, ChevronRight
} from 'lucide-react';
import './LandingPage.css';

const features = [
  { icon: FileText, title: 'AI Resume Builder', desc: 'Create professional, ATS-friendly resumes in minutes with AI-powered content generation.' },
  { icon: Wand2, title: 'Job Tailoring AI', desc: 'Automatically optimize your resume to match any job description with smart keyword analysis.' },
  { icon: ScanSearch, title: 'ATS Score Scanner', desc: 'Get instant ATS compatibility scores and actionable tips to beat applicant tracking systems.' },
  { icon: Mail, title: 'Cover Letter Generator', desc: 'Generate tailored cover letters that complement your resume and impress hiring managers.' },
  { icon: Target, title: '7+ Premium Templates', desc: 'Choose from professionally designed templates — Modern, Harvard, Europass, Creative, and more.' },
  { icon: ClipboardList, title: 'Application Tracker', desc: 'Track all your job applications, interviews, and offers in one organized dashboard.' },
];

const steps = [
  { num: '01', title: 'Build Your Resume', desc: 'Fill in your details or let AI generate content for each section automatically.' },
  { num: '02', title: 'Choose a Template', desc: 'Pick from 7+ premium templates designed for different industries and roles.' },
  { num: '03', title: 'Tailor & Apply', desc: 'Upload a job description and let AI optimize your resume for maximum impact.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer at Google', text: 'JobLume AI helped me tailor my resume perfectly. Got 3 interview calls in the first week!', rating: 5 },
  { name: 'Marcus Johnson', role: 'Product Manager', text: 'The ATS scanner is a game-changer. My resume went from 40% to 92% ATS score.', rating: 5 },
  { name: 'Aisha Patel', role: 'UX Designer at Figma', text: 'Beautiful templates and smart AI suggestions. This tool saved me hours of work.', rating: 5 },
];

const pricingPlans = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'Get started with the basics', features: ['1 Resume', '2 Templates', 'ATS Score Check', 'Basic Export (PDF)'], cta: 'Start Free', popular: false },
  { name: 'Pro', price: '$9', period: '/month', desc: 'Everything you need to land jobs', features: ['Unlimited Resumes', 'All 7+ Templates', 'AI Job Tailoring', 'Cover Letter Generator', 'ATS Scanner (unlimited)', 'PDF & DOCX Export', 'Application Tracker'], cta: 'Go Pro', popular: true },
  { name: 'Enterprise', price: '$29', period: '/month', desc: 'For teams and organizations', features: ['Everything in Pro', 'Team Management', 'Priority AI Processing', 'Custom Templates', 'API Access', 'Dedicated Support'], cta: 'Contact Sales', popular: false },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navbar />

      {/* ── Editorial Hero ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          {/* Subtle grid texture is handled by body noise filter and simple grid overlay */}
          <div className="hero-grid-overlay" />
        </div>
        <div className="container hero-content">
          <div className="hero-text-col">
            <div className="hero-badge animate-fade-in-up">
              <Sparkles size={14} strokeWidth={1.5} />
              <span>Career optimization platform</span>
            </div>
            <h1 className="hero-title animate-fade-in-up">
              Your next move,<br />
              clearly defined.
            </h1>
            <p className="hero-subtitle animate-fade-in-up">
              Crafted for career-level detail. Build, tailor, and track your applications with a platform designed for modern professionals.
            </p>
            <div className="hero-actions animate-fade-in-up">
              <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>
                Craft Your Resume
              </button>
              <button className="btn btn-secondary btn-xl" onClick={() => navigate('/#features')}>
                Explore Features
              </button>
            </div>
            <div className="hero-stats animate-fade-in-up">
              <div className="stat"><span className="stat-num">50K+</span><span className="stat-label">Resumes Crafted</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-num">89%</span><span className="stat-label">Interview Rate</span></div>
            </div>
          </div>
          
          <div className="hero-visual-col animate-fade-in">
            <div className="hero-floating-card">
              <div className="fc-header">
                <div className="fc-avatar">JD</div>
                <div>
                  <div className="fc-name">Jonathan Doe</div>
                  <div className="fc-role">Senior Product Designer</div>
                </div>
              </div>
              <div className="fc-body">
                <div className="fc-line w-full" />
                <div className="fc-line w-3/4" />
                <div className="fc-line w-5/6" />
                <div className="fc-spacer" />
                <div className="fc-heading" />
                <div className="fc-line w-full" />
                <div className="fc-line w-4/5" />
              </div>
              <div className="fc-badge"><Check size={12} strokeWidth={2} /> ATS Optimized</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="section features-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><Zap size={14} strokeWidth={1.5} /> Professional Tools</span>
            <h2 className="section-title">Everything you need,<br />designed for clarity.</h2>
            <p className="section-subtitle">Our suite of tools provides a distinct advantage in the modern job market.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="icon-soft mb-4"><f.icon size={24} strokeWidth={1.5} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section className="section steps-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><Target size={14} strokeWidth={1.5} /> Refined Workflow</span>
            <h2 className="section-title">A deliberate approach<br />to application building.</h2>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < steps.length - 1 && <ChevronRight className="step-arrow" size={24} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section className="section pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><Shield size={14} /> Fair Pricing</span>
            <h2 className="section-title">Choose Your Plan</h2>
            <p className="section-subtitle">Start for free. Upgrade when you're ready.</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`pricing-card card ${plan.popular ? 'pricing-popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-desc">{plan.desc}</p>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((f, j) => (
                    <li key={j}><Check size={16} className="check-icon" />{f}</li>
                  ))}
                </ul>
                <button className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => navigate('/register')}>{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section className="section testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><Star size={14} /> Loved by Users</span>
            <h2 className="section-title">What Our Users Say</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card card">
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }, (_, j) => <Star key={j} size={16} fill="var(--accent)" color="var(--accent)" />)}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <p className="author-name">{t.name}</p>
                    <p className="author-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card card">
            <h2>Your career deserves a tailored approach.</h2>
            <p>Join professionals who have elevated their applications with JobLume AI.</p>
            <button className="btn btn-primary btn-xl cta-btn" onClick={() => navigate('/register')}>
              Craft Your Resume
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
