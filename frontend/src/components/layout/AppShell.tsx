import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  LayoutDashboard,
  Database,
  BarChart2,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Sliders
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/workspace', label: 'Overview', icon: LayoutDashboard },
    { to: '/datasets', label: 'Datasets', icon: Database },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/dashboards', label: 'Dashboards', icon: Sliders },
    { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Collapsible Sidebar */}
      <aside
        className={`h-screen sticky top-0 flex flex-col justify-between border-r border-border bg-surface transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div>
          {/* Top branding */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <NavLink to="/workspace" className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-base tracking-tight truncate">
                  InsightCanvas <span className="text-ai">AI</span>
                </span>
              </NavLink>
            )}
            {collapsed && (
              <div className="mx-auto w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BarChart2 className="w-5 h-5" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-muted hover:text-text hover:bg-surface-2 transition-colors ml-auto"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-subtle'
                      : 'text-muted hover:text-text hover:bg-surface-2'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-border">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-2 py-1`}>
            {!collapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted font-bold text-xs uppercase shrink-0">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-text truncate">{user?.name || 'Analyst'}</div>
                  <div className="text-[10px] text-muted truncate">{user?.email || 'user@example.com'}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-muted hover:text-critical hover:bg-critical/10 rounded-lg transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global App Top Bar */}
        <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Functional Global Search */}
          <div className="relative w-72 sm:w-96">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search datasets, columns, dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-3">
            {user?.is_demo && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Demo Mode
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Child Page Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};
