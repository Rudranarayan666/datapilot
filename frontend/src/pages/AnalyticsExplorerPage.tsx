import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { DatasetSummary, BusinessInsight } from '../../types';
import {
  BarChart2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number>(1);
  const [stats, setStats] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [outliers, setOutliers] = useState<any>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [histogramCol, setHistogramCol] = useState<string>('Sales');
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDatasets().then((ds) => {
      setDatasets(ds);
      const urlId = searchParams.get('dataset_id');
      if (urlId) {
        setSelectedDatasetId(parseInt(urlId, 10));
      } else if (ds.length > 0) {
        setSelectedDatasetId(ds[0].id);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDatasetId) return;
    setLoading(true);

    Promise.all([
      api.getStatistics(selectedDatasetId),
      api.getCorrelation(selectedDatasetId),
      api.getOutliers(selectedDatasetId),
      api.getInsights(selectedDatasetId),
    ])
      .then(([st, corr, out, ins]) => {
        setStats(st);
        setCorrelation(corr);
        setOutliers(out);
        setInsights(ins.insights || []);

        if (st.columns && st.columns.length > 0) {
          const firstNum = st.columns[0].column;
          setHistogramCol(firstNum);
          api.getHistogram(selectedDatasetId, firstNum).then((h) => setHistogramData(h.bins || []));
        }
      })
      .finally(() => setLoading(false));
  }, [selectedDatasetId]);

  const handleHistogramColChange = (col: string) => {
    setHistogramCol(col);
    api.getHistogram(selectedDatasetId, col).then((h) => setHistogramData(h.bins || []));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Dataset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Analytics Explorer</h1>
          <p className="text-sm text-muted mt-1">
            Statistical profiles, Pearson correlation matrices, IQR outliers, and computed business insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted font-medium">Dataset:</label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (v{d.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Computing descriptive statistics...</div>
      ) : (
        <>
          {/* Section 1: Computed Business Insights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ai font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Deterministic Business Insights (Engine Computed)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="p-5 bg-surface rounded-xl border border-border shadow-subtle flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          ins.type === 'Warning'
                            ? 'bg-critical/10 text-critical border-critical/20'
                            : ins.type === 'Opportunity'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {ins.type}
                      </span>
                      <span className="text-xs font-semibold text-text">{ins.value}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-text">{ins.title}</h4>
                    <p className="text-xs text-muted">{ins.comparison}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-muted mt-0.5" />
                    <span>{ins.calculation_basis}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Correlation Heatmap & Neutral Insights */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h3 className="text-base font-bold text-text">Correlation Matrix</h3>
              <p className="text-xs text-muted">
                Pearson correlation coefficients (values strictly bounded between -1.0 and 1.0; neutral phrasing).
              </p>
            </div>

            {correlation && correlation.variables && correlation.variables.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border border-border text-left font-semibold text-text bg-surface-2">
                          Variable
                        </th>
                        {correlation.variables.map((v: string) => (
                          <th key={v} className="p-2 border border-border font-semibold text-text bg-surface-2">
                            {v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlation.matrix.map((row: any) => (
                        <tr key={row.variable}>
                          <td className="p-2 border border-border text-left font-semibold text-text bg-surface-2/40">
                            {row.variable}
                          </td>
                          {correlation.variables.map((col: string) => {
                            const val = row.correlations[col];
                            const isPositive = val > 0;
                            const intensity = Math.abs(val);
                            return (
                              <td
                                key={col}
                                className="p-2 border border-border font-mono font-medium"
                                style={{
                                  backgroundColor:
                                    val === 1
                                      ? 'transparent'
                                      : isPositive
                                      ? `rgba(59, 130, 246, ${intensity * 0.3})`
                                      : `rgba(239, 68, 68, ${intensity * 0.3})`,
                                }}
                              >
                                {val !== null ? val.toFixed(2) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {correlation.insights && correlation.insights.length > 0 && (
                  <div className="p-4 bg-surface-2 rounded-lg border border-border space-y-1">
                    <div className="text-xs font-semibold text-text mb-1">Observed Correlations:</div>
                    {correlation.insights.map((ci: string, idx: number) => (
                      <div key={idx} className="text-xs text-muted flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{ci}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted">Insufficient numeric variables to construct correlation matrix.</div>
            )}
          </div>

          {/* Section 3: Distribution Histogram */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Variable Distribution</h3>
                <p className="text-xs text-muted">Frequency histogram across equal-width continuous bins.</p>
              </div>

              {stats && stats.columns && (
                <select
                  value={histogramCol}
                  onChange={(e) => handleHistogramColChange(e.target.value)}
                  className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs font-semibold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {stats.columns.map((c: any) => (
                    <option key={c.column} value={c.column}>
                      {c.column}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.4} />
                  <XAxis dataKey="range" stroke="currentColor" className="text-muted" fontSize={11} />
                  <YAxis stroke="currentColor" className="text-muted" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-text)',
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
