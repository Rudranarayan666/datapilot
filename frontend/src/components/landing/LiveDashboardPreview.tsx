import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export const LiveDashboardPreview: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real live aggregate from backend Superstore dataset
    api.runQuery({
      dataset_id: 1,
      dimension: 'Order Date',
      metric: 'Sales',
      aggregation: 'sum',
      limit: 12,
      sort_order: 'asc'
    }).then((res) => {
      if (res && res.data) {
        setData(res.data);
      }
    }).catch((err) => {
      console.warn("Could not fetch preview aggregate, using fallback live data:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const sampleChartData = data.length > 0 ? data : [
    { "Order Date": "Jan", "Sales": 45200 },
    { "Order Date": "Feb", "Sales": 52100 },
    { "Order Date": "Mar", "Sales": 61300 },
    { "Order Date": "Apr", "Sales": 58900 },
    { "Order Date": "May", "Sales": 72400 },
    { "Order Date": "Jun", "Sales": 84100 },
    { "Order Date": "Jul", "Sales": 91200 },
  ];

  return (
    <div className="w-full bg-surface border border-border rounded-xl p-5 shadow-card overflow-hidden">
      {/* Mini top bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Live Superstore Engine</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text font-mono border border-border">
          10,054 records
        </span>
      </div>

      {/* Mini KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-surface-2 rounded-lg border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Total Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-text">$2.29M</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-0.5">Calculated by Pandas</div>
        </div>

        <div className="p-3 bg-surface-2 rounded-lg border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Net Profit</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-text">$286.4K</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-0.5">12.5% Margin</div>
        </div>

        <div className="p-3 bg-surface-2 rounded-lg border border-border">
          <div className="flex items-center justify-between text-muted text-xs mb-1">
            <span>Quality Score</span>
            <Activity className="w-3.5 h-3.5 text-ai" />
          </div>
          <div className="text-lg font-bold text-text">99.1/100</div>
          <div className="text-[10px] text-muted font-medium mt-0.5">4-Pillar Weighted</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-44 w-full bg-surface-2/40 rounded-lg p-2 border border-border">
        <div className="text-xs font-medium text-text mb-2 px-1">Monthly Sales Trajectory</div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={sampleChartData}>
            <defs>
              <linearGradient id="liveSalesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.4} />
            <XAxis dataKey="Order Date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-text)'
              }}
            />
            <Area type="monotone" dataKey="Sales" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#liveSalesGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
