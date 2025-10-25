import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import {
  Activity,
  Archive,
  BarChart2,
  LogOut,
  NotebookPen,
  Settings,
  Shield,
  UserCircle2,
  Users,
} from 'lucide-react';

const navItems = [
  { to: '/app', label: 'Overview', icon: <Activity size={18} /> },
  { to: '/app/profile', label: 'Profile', icon: <UserCircle2 size={18} /> },
  { to: '/app/records', label: 'My Records', icon: <NotebookPen size={18} /> },
  { to: '/app/audit', label: 'Audit Logs', icon: <Archive size={18} />, adminOnly: true },
  { to: '/app/users', label: 'User Directory', icon: <Users size={18} />, adminOnly: true },
  { to: '/app/admin/stats', label: 'Admin Analytics', icon: <BarChart2 size={18} />, adminOnly: true },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'PATIENT';

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield size={28} />
          <div>
            <h1>Weight Loss Clinic</h1>
            <span>Care Portal</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.adminOnly || role === 'ADMIN')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  `nav-entry ${isActive ? 'nav-entry-active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user?.firstName?.[0]}</div>
            <div>
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>
              <span className="sidebar-role">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" fullWidth leftIcon={<LogOut size={16} />} onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2>Welcome back, {user?.firstName} 👋</h2>
            <p className="topbar-subtle">
              Stay on top of your care plan, track progress, and keep your clinical data tidy.
            </p>
          </div>
          <div className="topbar-actions">
            <Button
              variant="secondary"
              leftIcon={<Settings size={16} />}
              onClick={() => navigate('/app/profile')}
            >
              Account Settings
            </Button>
          </div>
        </header>
        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
