import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Building2, FileText, Users, BarChart3,
  Bot, User, LogOut, Settings, Newspaper, Menu, X, Footprints, ClipboardCheck, PlusCircle
} from 'lucide-react';

const roleLabels = { admin: 'Адміністратор', shelter_owner: 'Власник притулку', user: 'Користувач' };
const roleColors = { admin: '#FF6B35', shelter_owner: '#2D6A4F', user: '#6B7280' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // перенесли сюди

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: Home, label: 'Головна', section: 'Навігація' },
    { to: '/animals', icon: Footprints, label: 'Тварини', section: 'Навігація' },
    { to: '/shelters', icon: Building2, label: 'Притулки', section: 'Навігація' },
    { to: '/news', icon: Newspaper, label: 'Новини', section: 'Навігація' },
    { to: '/applications', icon: FileText, label: 'Заявки', section: 'Особисте' },
    ...(user?.role === 'user' ? [
      { to: '/my-submissions', icon: PlusCircle, label: 'Мої оголошення', section: 'Особисте' }
    ] : []),
    { to: '/ai', icon: Bot, label: 'AI Помічник', section: 'Особисте' },
    { to: '/profile', icon: User, label: 'Профіль', section: 'Особисте' },
    ...(user?.role === 'shelter_owner' || user?.role === 'admin' ? [
      { to: '/shelter/manage', icon: Settings, label: 'Керування притулком', section: 'Управління' }
    ] : []),
    ...(user?.role === 'admin' ? [
      { to: '/admin/moderation', icon: ClipboardCheck, label: 'Модерація', section: 'Адмін' },
      { to: '/admin/users', icon: Users, label: 'Користувачі', section: 'Адмін' },
      { to: '/admin/stats', icon: BarChart3, label: 'Статистика', section: 'Адмін' }
    ] : []),
  ];

  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <div className="layout">
      <button
        className="btn btn-ghost btn-sm"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 200, display: 'none' }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        id="sidebar-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
           CarePaw
          <span>Платформа допомоги тваринам</span>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section} className="nav-section">
              <div className="nav-section-title">{section}</div>
              {navItems.filter(i => i.section === section).map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role" style={{ color: roleColors[user?.role] }}>
                {roleLabels[user?.role]}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }} onClick={handleLogout}>
            <LogOut size={16} /> Вийти
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}