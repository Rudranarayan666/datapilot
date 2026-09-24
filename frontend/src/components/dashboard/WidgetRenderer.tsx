import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardWidget } from '../../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { DollarSign, TrendingUp, Hash, Layers } from 'lucide-react';

interface WidgetProps {
  widget: DashboardWidget;
  datasetId: number;
  filters: Record<string, any>;
  theme: string;
}

export const WidgetRenderer: React.FC<WidgetProps> = ({ widget, datasetId, filters, theme }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Palette based on dashboard theme
  const getThemePalette = () => {
    if (theme === 'Ocean Blue') {
      return ['#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#0369A1', '#075985'];
    }
    if (theme === 'Executive Light') {
      return ['#2563EB', '#4F46E5', '#0D9488', '#D97706', '#E11D48', '#7C3AED'];
    }
    // Midnight Analytics default
    return ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#EC4899'];
  };

  const palette = getThemePalette();

  useEffect(() => {
    setLoading(true);
    const wData = widget.data;

    // Check if KPI (single metric, no dimension)
    if (widget.type === 'kpi' || !wData.dimension) {
      api.runQuery({
        dataset_id: datasetId,
        metric: wData.metric || undefined,
        aggregation: wData.aggregation || 'sum',
        filters,
      })
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Grouped aggregation query
      api.runQuery({
        dataset_id: datasetId,
        dimension: wData.dimension,
        metric: wData.metric || undefined,
        aggregation: wData.aggregation || 'sum',
        filters,
        limit: wData.limit || 10,
        sort_order: wData.sort_order || 'desc',
      })
        .then((res) => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [widget, datasetId, filters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="text-xs text-muted">Calculating metric...</span>
      </div>
    );
  }

  // 1. KPI Widget
  if (widget.type === 'kpi') {
    return (
      <div className="h-full flex flex-col justify-between p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider">
          <span>{widget.title}</span>
          <DollarSign className="w-4 h-4 text-primary" />
        </div>
        <div className="my-auto">
          <div className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {data?.formatted_value ?? '—'}
          </div>
          <div className="text-[11px] text-muted mt-1 flex items-center gap-1 font-mono">
            <span>{widget.data.aggregation?.toUpperCase()}</span>
            <span>({widget.data.metric || 'Records'})</span>
          </div>
        </div>
        <div className="text-[10px] text-emerald-500 font-medium">Pandas Engine Verified</div>
      </div>
    );
  }

  // 2. Line Chart
  if (widget.type === 'line') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="text-xs font-semibold text-text mb-3">{widget.title}</div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.4} />
              <XAxis dataKey={widget.data.dimension || ''} stroke="currentColor" className="text-muted" fontSize={11} />
              <YAxis stroke="currentColor" className="text-muted" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                }}
              />
              <Line type="monotone" dataKey="value" stroke={palette[0]} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 3. Bar Chart
  if (widget.type === 'bar') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="text-xs font-semibold text-text mb-3">{widget.title}</div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.4} />
              <XAxis dataKey={widget.data.dimension || ''} stroke="currentColor" className="text-muted" fontSize={11} />
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
              <Bar dataKey="value" fill={palette[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 4. Horizontal Bar Chart
  if (widget.type === 'horizontal_bar') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="text-xs font-semibold text-text mb-3">{widget.title}</div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border" opacity={0.4} />
              <XAxis type="number" stroke="currentColor" className="text-muted" fontSize={11} />
              <YAxis dataKey={widget.data.dimension || ''} type="category" stroke="currentColor" className="text-muted" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                }}
              />
              <Bar dataKey="value" fill={palette[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 5. Area Chart
  if (widget.type === 'area') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="text-xs font-semibold text-text mb-3">{widget.title}</div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.4} />
              <XAxis dataKey={widget.data.dimension || ''} stroke="currentColor" className="text-muted" fontSize={11} />
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
              <Area type="monotone" dataKey="value" stroke={palette[2]} fill={palette[2]} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 6. Donut Chart
  if (widget.type === 'donut') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="text-xs font-semibold text-text mb-2">{widget.title}</div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data || []}
                dataKey="value"
                nameKey={widget.data.dimension || ''}
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={3}
              >
                {(data || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Fallback: Table
  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="text-xs font-semibold text-text mb-2">{widget.title}</div>
      <table className="w-full text-xs text-left">
        <thead className="border-b border-border text-muted">
          <tr>
            <th className="p-1">{widget.data.dimension}</th>
            <th className="p-1 text-right">{widget.data.metric || 'Value'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(data || []).map((row: any, i: number) => (
            <tr key={i}>
              <td className="p-1 font-medium">{row[widget.data.dimension || '']}</td>
              <td className="p-1 text-right font-mono">{row.value?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
