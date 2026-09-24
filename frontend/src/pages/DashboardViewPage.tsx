import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Dashboard, DashboardConfig, DashboardWidget } from '../types';
import { WidgetRenderer } from '../components/dashboard/WidgetRenderer';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Download,
  Image as ImageIcon,
  FileJson,
  FileText,
  Settings2,
  Palette,
  Filter,
  Sparkles,
  Send,
  ChevronDown,
  Move,
  Trash2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const DashboardViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = parseInt(id || '0', 10);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dashTheme, setDashTheme] = useState('Midnight Analytics');
  const [chatCommand, setChatCommand] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!dashboardId) return;
    setLoading(true);
    api.getDashboard(dashboardId)
      .then((d) => {
        setDashboard(d);
        const cfg = d.config as DashboardConfig;
        setDashTheme(cfg.theme || d.theme || 'Midnight Analytics');
        setFilters(cfg.filters || {});

        // Fetch filter options from dataset columns
        if (d.dataset_id) {
          api.getDatasetProfile(d.dataset_id).then((prof) => {
            const opts: Record<string, string[]> = {};
            for (const col of prof.columns) {
              if (col.general_type === 'categorical' && col.unique_count <= 50 && col.unique_count >= 2) {
                opts[col.name] = col.sample_values.map(String);
              }
            }
            setFilterOptions(opts);
          });
        }
      })
      .finally(() => setLoading(false));
  }, [dashboardId]);

  const handleThemeChange = async (theme: string) => {
    if (!dashboard) return;
    setDashTheme(theme);
    const cfg = { ...(dashboard.config as DashboardConfig), theme };
    await api.updateDashboard(dashboard.id, { theme, config: cfg });
    setDashboard({ ...dashboard, theme, config: cfg });
  };

  const handleFilterChange = (column: string, value: string) => {
    const newFilters = { ...filters, [column]: value === 'All' ? undefined : value };
    setFilters(newFilters);
  };

  const handleAssistantCommand = async () => {
    if (!chatCommand.trim() || !dashboard) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await api.patchDashboard(dashboard.id, chatCommand);
      setChatResponse(res.summary);
      if (res.applied) {
        const refreshed = await api.getDashboard(dashboard.id);
        setDashboard(refreshed);
      }
    } catch (err: any) {
      setChatResponse('Command could not be applied: ' + err.message);
    } finally {
      setChatLoading(false);
      setChatCommand('');
    }
  };

  const exportPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${dashboard?.title || 'dashboard'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, { quality: 0.9, pixelRatio: 2 });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvasRef.current.offsetHeight / canvasRef.current.offsetWidth) * imgWidth;
      pdf.addImage(dataUrl, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 190));
      pdf.save(`${dashboard?.title || 'dashboard'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const exportJSON = () => {
    if (!dashboard) return;
    const blob = new Blob([JSON.stringify(dashboard.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${dashboard.title || 'dashboard'}_config.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportBISpec = async () => {
    if (!dashboard) return;
    try {
      const spec = await api.getBiSpec(dashboard.id);
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${dashboard.title || 'dashboard'}_bi_spec.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('BI Spec export failed:', err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Loading dashboard configuration...</div>;
  }

  if (!dashboard) {
    return <div className="p-12 text-center text-critical text-sm">Dashboard not found.</div>;
  }

  const config = dashboard.config as DashboardConfig;
  const widgets = config.widgets || [];

  // Dashboard theme token class
  const dashThemeClass =
    dashTheme === 'Ocean Blue'
      ? 'bg-[#0C1829] text-[#E0F2FE]'
      : dashTheme === 'Executive Light'
      ? 'bg-[#F8FAFC] text-[#0F172A]'
      : 'bg-[#0B1020] text-[#E6EAF2]'; // Midnight Analytics

  const dashSurfaceClass =
    dashTheme === 'Ocean Blue'
      ? 'bg-[#0F2035] border-[#1E3A5F]'
      : dashTheme === 'Executive Light'
      ? 'bg-white border-[#E2E8F0]'
      : 'bg-[#111827] border-[#263047]';

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">{dashboard.title}</h1>
          <p className="text-xs text-muted mt-0.5">
            Dataset: {dashboard.dataset_name} · {widgets.length} widgets · Theme: {dashTheme}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dashboard Theme Switcher */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
            {['Midnight Analytics', 'Executive Light', 'Ocean Blue'].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  dashTheme === t
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {/* Export Menu */}
          <div className="relative group">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors shadow-subtle">
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-card z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportPNG} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-surface-2 rounded-t-xl">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Dashboard PNG (HD)
              </button>
              <button onClick={exportPDF} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-surface-2">
                <FileText className="w-3.5 h-3.5 text-critical" /> Dashboard PDF
              </button>
              <button onClick={exportJSON} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-surface-2">
                <FileJson className="w-3.5 h-3.5 text-amber-500" /> Configuration JSON
              </button>
              <button onClick={exportBISpec} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-surface-2 rounded-b-xl">
                <Settings2 className="w-3.5 h-3.5 text-emerald-500" /> BI Specification JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && Object.keys(filterOptions).length > 0 && (
        <div className="p-4 bg-surface border border-border rounded-xl flex flex-wrap items-center gap-4 shadow-subtle">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Active Filters:</span>
          {Object.entries(filterOptions).slice(0, 4).map(([col, opts]) => (
            <div key={col} className="flex items-center gap-2">
              <label className="text-xs font-medium text-text">{col}:</label>
              <select
                value={filters[col] || 'All'}
                onChange={(e) => handleFilterChange(col, e.target.value)}
                className="px-2 py-1 bg-surface-2 border border-border rounded-lg text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All</option>
                {opts.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Canvas */}
      <div ref={canvasRef} className={`rounded-2xl p-5 shadow-card ${dashThemeClass} border border-border/30`}>
        <GridLayout
          className="layout"
          cols={12}
          rowHeight={36}
          width={1200}
          isDraggable
          isResizable
          onLayoutChange={async (layout: Layout[]) => {
            if (!dashboard) return;
            const updatedWidgets = widgets.map((w) => {
              const l = layout.find((li) => li.i === w.id);
              if (!l) return w;
              return { ...w, position: { x: l.x, y: l.y, w: l.w, h: l.h } };
            });
            const cfg = { ...(dashboard.config as DashboardConfig), widgets: updatedWidgets };
            await api.updateDashboard(dashboard.id, { config: cfg });
          }}
        >
          {widgets.map((w) => (
            <div
              key={w.id}
              data-grid={{
                x: w.position?.x ?? 0,
                y: w.position?.y ?? 0,
                w: w.position?.w ?? 3,
                h: w.position?.h ?? 3,
                minW: 2,
                minH: 2,
              }}
              className={`rounded-xl border shadow-subtle overflow-hidden ${dashSurfaceClass}`}
            >
              <WidgetRenderer
                widget={w}
                datasetId={dashboard.dataset_id}
                filters={filters}
                theme={dashTheme}
              />
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Dashboard AI Assistant */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-ai font-semibold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Dashboard AI Assistant</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={chatCommand}
            onChange={(e) => setChatCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAssistantCommand()}
            placeholder='e.g. "change regional chart to horizontal bars", "add profit margin KPI", "theme to Ocean Blue"'
            className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ai"
          />
          <button
            onClick={handleAssistantCommand}
            disabled={chatLoading}
            className="px-4 py-2 bg-ai hover:bg-ai-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {chatLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>

        {chatResponse && (
          <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs text-text">
            {chatResponse}
          </div>
        )}
      </div>
    </div>
  );
};
