import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Clock,
  Database,
  BarChart3,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const DashboardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<number>(0);
  const [genQuestion, setGenQuestion] = useState('Create an executive dashboard showing key metrics, trends, and regional performance');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.getDashboards(), api.getDatasets()])
      .then(([db, ds]) => {
        setDashboards(db);
        setDatasets(ds);
        if (ds.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(ds[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!selectedDatasetId) return;
    setCreating(true);
    try {
      const plan = await api.planAnalysis(selectedDatasetId, genQuestion);
      const title = newTitle.trim() || plan.dashboard_plan.title || 'New Dashboard';
      const newDash = await api.createDashboard({
        dataset_id: selectedDatasetId,
        title,
        description: plan.dashboard_plan.description,
        theme: plan.dashboard_plan.theme || 'Midnight Analytics',
        config: plan.dashboard_plan,
      });
      setShowCreateModal(false);
      navigate(`/dashboard/${newDash.id}`);
    } catch (err: any) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this dashboard?')) return;
    setDeleting(id);
    try {
      await api.deleteDashboard(id);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const themeColor = (theme: string) => {
    if (theme === 'Ocean Blue') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (theme === 'Executive Light') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Dashboards
          </h1>
          <p className="text-sm text-muted mt-1">
            AI-generated, data-validated BI dashboards. Each dashboard is a live config backed by pandas queries.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Dashboard
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg shadow-card space-y-5">
            <div className="flex items-center gap-2 text-ai font-semibold">
              <Sparkles className="w-5 h-5" />
              <span>Generate New Dashboard</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Dashboard Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Executive Sales Overview (auto-generated if blank)"
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Dataset</label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.row_count?.toLocaleString()} rows)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Business Question</label>
                <textarea
                  value={genQuestion}
                  onChange={(e) => setGenQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ai resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-surface-2 border border-border text-sm font-semibold text-text rounded-lg hover:bg-border/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedDatasetId}
                className="flex-1 px-4 py-2.5 bg-ai hover:bg-ai-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted text-sm">Loading dashboards...</div>
      ) : dashboards.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">No dashboards yet</p>
            <p className="text-xs text-muted mt-1">Click "New Dashboard" to generate one from your data.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" /> Create First Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((d) => (
            <div
              key={d.id}
              className="bg-surface border border-border rounded-xl shadow-card hover:border-primary/40 transition-colors group flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${themeColor(d.theme)}`}>
                    {d.theme || 'Midnight'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text leading-tight group-hover:text-primary transition-colors">
                    {d.title}
                  </h3>
                  {d.description && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">{d.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    {d.dataset_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {d.widget_count} widgets
                  </span>
                </div>

                {d.updated_at && (
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(d.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="border-t border-border px-5 py-3 flex items-center justify-between">
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting === d.id}
                  className="p-1.5 text-muted hover:text-critical hover:bg-critical/10 rounded-lg transition-colors"
                  title="Delete dashboard"
                >
                  {deleting === d.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <Link
                  to={`/dashboard/${d.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-subtle"
                >
                  Open
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
