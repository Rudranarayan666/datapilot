import React from 'react';
import { useAuthStore, useThemeStore } from '../../store';
import { ThemeToggle } from '../common/ThemeToggle';
import { User, Shield, Palette, Database, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-sm text-muted mt-1">Application preferences and account configuration.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <User className="w-4 h-4 text-primary" />
          Profile
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Name</label>
            <div className="mt-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text">
              {user?.name || 'Analyst'}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Email</label>
            <div className="mt-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text">
              {user?.email || 'user@example.com'}
            </div>
          </div>
        </div>
        {user?.is_demo && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
            You are using a demo session. Sign up for a persistent account.
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Palette className="w-4 h-4 text-ai" />
          Appearance
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">Theme Mode</div>
            <div className="text-xs text-muted">
              Current: <span className="font-semibold capitalize">{theme}</span>. Preference persisted to localStorage.
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Engine Info */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Info className="w-4 h-4 text-emerald-500" />
          Analytics Engine
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-surface-2 rounded-lg border border-border">
            <span className="text-muted">Compute Engine:</span>
            <span className="ml-2 text-text font-semibold">Pandas + NumPy</span>
          </div>
          <div className="p-3 bg-surface-2 rounded-lg border border-border">
            <span className="text-muted">Database:</span>
            <span className="ml-2 text-text font-semibold">SQLite (PostgreSQL-ready)</span>
          </div>
          <div className="p-3 bg-surface-2 rounded-lg border border-border">
            <span className="text-muted">LLM Provider:</span>
            <span className="ml-2 text-text font-semibold">None (rule-based fallback active)</span>
          </div>
          <div className="p-3 bg-surface-2 rounded-lg border border-border">
            <span className="text-muted">Auth:</span>
            <span className="ml-2 text-text font-semibold">JWT + bcrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
