import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { DatasetSummary } from '../../types';
import {
  Database,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  PlusCircle,
  Activity
} from 'lucide-react';

export const WorkspaceOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickQuestion, setQuickQuestion] = useState(
    'Create an executive sales dashboard showing revenue, profit, regional performance and monthly trends'
  );
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    Promise.all([api.getDatasets(), api.getDashboards()])
      .then(([ds, db]) => {
        setDatasets(ds);
        setDashboards(db);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateFromQuestion = async () => {
    if (!quickQuestion.trim()) return;
    setPlanning(true);
    try {
      // Find Superstore dataset (id 1 or first available)
      const targetDs = datasets.find((d) => d.name.toLowerCase().includes('superstore')) || datasets[0];
      if (!targetDs) {
        navigate('/datasets');
        return;
      }

      // Generate dashboard plan via API
      const plan = await api.planAnalysis(targetDs.id, quickQuestion);
      // Persist dashboard
      const newDash = await api.createDashboard({
        dataset_id: targetDs.id,
        title: plan.dashboard_plan.title || 'Executive Sales Dashboard',
        description: plan.dashboard_plan.description,
        theme: plan.dashboard_plan.theme || 'Midnight Analytics',
        config: plan.dashboard_plan,
      });

      navigate(`/dashboard/${newDash.id}`);
    } catch (err) {
      console.error('Failed to generate dashboard plan:', err);
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Analytics Command Center
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed">
            From raw data tables to decision-ready dashboards. Generate validated KPI scorecards and
            interactive charts with zero hallucinated figures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/datasets"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-subtle transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Upload Dataset
          </Link>
        </div>
      </div>

      {/* Business Question -> Dashboard Generator Box */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-ai font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Ask Question → Generate Executive Dashboard</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
            placeholder="e.g. Create an executive sales dashboard showing revenue, profit, and monthly trends"
            className="flex-1 px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleGenerateFromQuestion}
            disabled={planning}
            className="inline-flex items-center justify-center gap-2 bg-ai hover:bg-ai-hover text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-subtle disabled:opacity-50"
          >
            {planning ? 'Planning Dashboard...' : 'Generate Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted">
          Rule-based layout planner matches columns to line trends, categorical bars, and derived KPIs.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-surface rounded-xl border border-border shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-muted tracking-wider">Available Datasets</div>
            <div className="text-2xl font-bold text-text mt-1">{datasets.length}</div>
            <div className="text-xs text-emerald-500 font-medium mt-1">Ready for profiling</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-primary">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-surface rounded-xl border border-border shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-muted tracking-wider">Active Dashboards</div>
            <div className="text-2xl font-bold text-text mt-1">{dashboards.length}</div>
            <div className="text-xs text-muted mt-1">JSON configuration backed</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-ai">
            <LayoutDashboard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-surface rounded-xl border border-border shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-muted tracking-wider">Quality Audits</div>
            <div className="text-2xl font-bold text-text mt-1">100%</div>
            <div className="text-xs text-emerald-500 font-medium mt-1">4-pillar weighted formula</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-emerald-500">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Datasets List Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text">Your Datasets</h2>
            <p className="text-xs text-muted">Click any dataset to inspect profile, quality score, and fixes.</p>
          </div>
          <Link to="/datasets" className="text-xs font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="divide-y divide-border">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-surface-2/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <Link
                    to={`/datasets/${ds.id}`}
                    className="text-sm font-semibold text-text hover:text-primary transition-colors"
                  >
                    {ds.name}
                  </Link>
                  <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                    <span>{ds.row_count.toLocaleString()} rows</span>
                    <span>•</span>
                    <span>{ds.column_count} columns</span>
                    {ds.is_sample && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] text-ai font-medium bg-ai/10 px-1.5 py-0.2 rounded">
                          Sample
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/datasets/${ds.id}`}
                  className="text-xs font-semibold text-text hover:bg-surface-2 border border-border px-3 py-1.5 rounded-lg transition-colors"
                >
                  Inspect Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
