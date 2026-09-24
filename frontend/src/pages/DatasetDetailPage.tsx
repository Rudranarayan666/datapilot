import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { DatasetProfile, DatasetQuality } from '../../types';
import {
  ShieldCheck,
  Table,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const DatasetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasetId = parseInt(id || '1', 10);

  const [activeTab, setActiveTab] = useState<'profile' | 'quality'>('profile');
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [quality, setQuality] = useState<DatasetQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getDatasetProfile(datasetId), api.getDatasetQuality(datasetId)])
      .then(([prof, qual]) => {
        setProfile(prof);
        setQuality(qual);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [datasetId]);

  const handleApplyFix = async (action: string) => {
    setCleaning(true);
    setCleanSuccess(null);
    try {
      const newDs = await api.cleanDataset(datasetId, [action]);
      setCleanSuccess(`Successfully created cleaned dataset version v${newDs.version}: ${newDs.name}`);
      setTimeout(() => {
        navigate(`/datasets/${newDs.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Cleaning failed:', err);
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Computing dataset profile & quality audit...</div>;
  }

  if (!profile || !quality) {
    return <div className="p-12 text-center text-critical text-sm">Dataset profile could not be loaded.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Link to="/datasets" className="hover:text-text">
              Datasets
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text font-medium">{profile.dataset_name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-3">
            <span>{profile.dataset_name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
              Score: {quality.overall_score}/100
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/analytics?dataset_id=${datasetId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-text bg-surface hover:bg-surface-2 border border-border shadow-subtle transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            Analytics Explorer
          </Link>
        </div>
      </div>

      {cleanSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{cleanSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Table className="w-4 h-4" />
          Data Profiling ({profile.total_columns} columns)
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'quality'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Data Quality & Remediation ({quality.issues.length} issues)
        </button>
      </div>

      {/* Tab 1: Profiling */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-xs text-muted font-medium">Total Rows</div>
              <div className="text-xl font-bold text-text mt-1">{profile.total_rows.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-xs text-muted font-medium">Duplicate Rows</div>
              <div className="text-xl font-bold text-text mt-1">
                {profile.duplicate_rows.toLocaleString()} ({profile.duplicate_rows_percentage}%)
              </div>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-xs text-muted font-medium">Missing Cells</div>
              <div className="text-xl font-bold text-text mt-1">
                {profile.missing_cells.toLocaleString()} ({profile.missing_cells_percentage}%)
              </div>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-xs text-muted font-medium">Column Types</div>
              <div className="text-xs text-text font-semibold mt-2 space-y-0.5">
                <div>{profile.numeric_columns_count} Numeric</div>
                <div>{profile.categorical_columns_count} Categorical</div>
                <div>{profile.datetime_columns_count} Datetime</div>
              </div>
            </div>
          </div>

          {/* Per-Column Profiling Table */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text">
                <thead className="bg-surface-2/60 border-b border-border uppercase font-semibold text-muted tracking-wider">
                  <tr>
                    <th className="p-3">Column Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Unique</th>
                    <th className="p-3">Missing</th>
                    <th className="p-3">Min / Max</th>
                    <th className="p-3">Mean / Median</th>
                    <th className="p-3">Top Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profile.columns.map((c) => (
                    <tr key={c.name} className="hover:bg-surface-2/30 transition-colors">
                      <td className="p-3 font-semibold text-text">{c.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[11px] font-mono">
                          {c.general_type}
                        </span>
                      </td>
                      <td className="p-3">{c.unique_count.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={c.missing_count > 0 ? 'text-amber-500 font-medium' : 'text-muted'}>
                          {c.missing_count} ({c.missing_percentage}%)
                        </span>
                      </td>
                      <td className="p-3 text-muted">
                        {c.min !== null && c.max !== null ? `${c.min} → ${c.max}` : '—'}
                      </td>
                      <td className="p-3 text-muted">
                        {c.mean !== null ? `μ ${c.mean} | m ${c.median}` : '—'}
                      </td>
                      <td className="p-3 text-muted">
                        {c.top_value ? `${c.top_value} (${c.top_value_frequency})` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quality Score & Remediation */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          {/* Quality Score Breakdown Card */}
          <div className="p-6 bg-surface rounded-xl border border-border shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-500/10 shrink-0">
                <span className="text-2xl font-extrabold text-text">{quality.overall_score}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-text">4-Pillar Quality Audit</h3>
                <p className="text-xs text-muted max-w-md">
                  Weighted formula: 35% Completeness + 25% Uniqueness + 20% Validity + 20% Consistency.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-3 bg-surface-2 rounded-lg border border-border text-center">
                <div className="text-[11px] text-muted uppercase font-semibold">Completeness</div>
                <div className="text-base font-bold text-text mt-0.5">{quality.scores.completeness}%</div>
              </div>
              <div className="p-3 bg-surface-2 rounded-lg border border-border text-center">
                <div className="text-[11px] text-muted uppercase font-semibold">Uniqueness</div>
                <div className="text-base font-bold text-text mt-0.5">{quality.scores.uniqueness}%</div>
              </div>
              <div className="p-3 bg-surface-2 rounded-lg border border-border text-center">
                <div className="text-[11px] text-muted uppercase font-semibold">Validity</div>
                <div className="text-base font-bold text-text mt-0.5">{quality.scores.validity}%</div>
              </div>
              <div className="p-3 bg-surface-2 rounded-lg border border-border text-center">
                <div className="text-[11px] text-muted uppercase font-semibold">Consistency</div>
                <div className="text-base font-bold text-text mt-0.5">{quality.scores.consistency}%</div>
              </div>
            </div>
          </div>

          {/* Issues and Actionable Fixes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text">Detected Audit Findings & Non-Destructive Fixes</h3>
            {quality.issues.map((iss, idx) => (
              <div
                key={idx}
                className="p-5 bg-surface rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        iss.severity === 'high'
                          ? 'bg-critical/10 text-critical border-critical/20'
                          : iss.severity === 'medium'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {iss.severity} severity
                    </span>
                    <span className="text-xs font-semibold text-text capitalize">
                      {iss.issue_type.replace('_', ' ')}
                    </span>
                    {iss.column && (
                      <span className="text-xs font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">
                        {iss.column}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{iss.suggested_fix}</p>
                  <div className="text-[11px] text-muted">
                    Affected: <span className="font-semibold text-text">{iss.affected_rows} rows</span> ({iss.affected_percentage}%)
                  </div>
                </div>

                <button
                  onClick={() => handleApplyFix(iss.fix_action)}
                  disabled={cleaning}
                  className="px-4 py-2 bg-surface hover:bg-surface-2 text-primary border border-border rounded-lg text-xs font-semibold shadow-subtle transition-colors shrink-0 disabled:opacity-50"
                >
                  {cleaning ? 'Applying...' : 'Apply Fix (Create v' + (profile.dataset_id + 1) + ')'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
