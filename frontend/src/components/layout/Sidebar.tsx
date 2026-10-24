import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, FileText, Layout, Wand2, Mail,
  ScanSearch, ClipboardList, User, Settings,
  LogOut, Sun, Moon, Sparkles, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import UpgradeModal from '../subscription/UpgradeModal';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/resumes', icon: FileText, label: 'My Resumes' },
  { path: '/dashboard/templates', icon: Layout, label: 'Templates' },
  { path: '/dashboard/job-tailor', icon: Wand2, label: 'Job Tailor AI' },
  { path: '/dashboard/cover-letters', icon: Mail, label: 'Cover Letters' },
  { path: '/dashboard/ats-scanner', icon: ScanSearch, label: 'ATS Scanner' },
  { path: '/dashboard/applications', icon: ClipboardList, label: 'App Tracker' },
  { path: '/dashboard/profile', icon: User, label: 'Master Profile' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon-sm"><Sparkles size={18} /></div>
          {!collapsed && <span className="brand-text-sm">JobLume<span className="brand-ai">AI</span></span>}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <ChevronLeft size={18} className={collapsed ? 'rotated' : ''} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button className="sidebar-link logout-link" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>

        {!collapsed && user && user.subscription_tier !== 'pro' && (
          <button className="upgrade-prompt-btn animate-scale-in" onClick={() => setIsUpgradeModalOpen(true)}>
            <Sparkles size={16} className="upgrade-sparkle" /> Upgrade to Pro
          </button>
        )}

        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          plan="pro"
        />
        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="user-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.full_name}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
