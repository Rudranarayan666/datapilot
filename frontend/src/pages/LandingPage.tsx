import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';
import { ThemeToggle } from '../common/ThemeToggle';
import { LiveDashboardPreview } from './LiveDashboardPreview';
import {
  BarChart3,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Layers,
  ChevronDown,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Scrollspy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'how', 'demo', 'faq'];
      const scrollPos = window.scrollY + 100;
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el && el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
          setActiveSection(s);
          return;
        }
      }
      if (window.scrollY < 200) setActiveSection('hero');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await api.demoLogin();
      setAuth(res.user, res.access_token);
      navigate('/workspace');
    } catch (err) {
      console.error('Demo login failed', err);
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'What file types are supported?',
      a: 'InsightCanvas AI supports CSV, XLSX, and XLS formats up to 25MB. Uploaded datasets are parsed, validated, and profiled deterministically by our Python engine.',
    },
    {
      q: 'Is my raw dataset sent to external AI models?',
      a: 'Never. The deterministic Pandas engine computes 100% of the numbers, correlations, outliers, and metrics locally. The optional LLM layer only receives column metadata and pre-computed summaries for explanations.',
    },
    {
      q: 'Does InsightCanvas AI function without an API key?',
      a: 'Yes, completely. The core analytics, KPI engine, chart recommender, natural query interpreter ("Ask Your Data"), and dashboard builder all run deterministically with zero API keys required.',
    },
    {
      q: 'How does data cleaning work?',
      a: 'When you apply fixes (e.g. dropping duplicates, imputing missing values, capping outliers), a new versioned dataset is created. Your original raw data is never mutated or overwritten.',
    },
    {
      q: 'What formats can I export to?',
      a: 'You can export high-resolution dashboard PNG images, formatted PDF summaries, the raw Dashboard Configuration JSON, and a structured BI Dashboard Specification JSON.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col selection:bg-primary/20">
      {/* Sticky Solid Navbar */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-text">
              InsightCanvas <span className="text-ai">AI</span>
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { id: 'features', label: 'Features' },
              { id: 'how', label: 'How it Works' },
              { id: 'demo', label: 'Demo' },
              { id: 'faq', label: 'FAQ' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.id ? 'text-primary font-semibold' : 'text-muted hover:text-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-text px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors shadow-subtle"
            >
              Start Analyzing
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-border text-text hover:bg-surface-2"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-surface px-4 pt-2 pb-4 space-y-2">
            {['features', 'how', 'demo', 'faq'].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left py-2 text-sm font-medium text-muted hover:text-text capitalize"
              >
                {id.replace('-', ' ')}
              </button>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Link to="/login" className="text-center py-2 text-sm font-medium text-text bg-surface-2 rounded-lg">
                Log in
              </Link>
              <Link to="/signup" className="text-center py-2 text-sm font-semibold text-white bg-primary rounded-lg">
                Start Analyzing
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content sections */}
      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Deterministic Analytics Engine + Constrained AI
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text leading-[1.15]">
                  Turn Raw Data Into Decision-Ready Dashboards
                </h1>
                <p className="text-lg text-muted max-w-xl leading-relaxed">
                  Upload your data, ask a business question, and get an interactive dashboard with
                  data-backed insights. Powered by verifiable Pandas calculations.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg shadow-subtle transition-all"
                  >
                    Start Analyzing <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleTryDemo}
                    disabled={demoLoading}
                    className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 text-text font-semibold px-6 py-3 rounded-lg border border-border shadow-subtle transition-all"
                  >
                    {demoLoading ? 'Loading Demo...' : 'Try Demo'}
                  </button>
                </div>

                <div className="flex items-center gap-6 pt-4 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>No API key required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Zero data hallucination</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Instant demo dataset</span>
                  </div>
                </div>
              </div>

              {/* Right Column: LIVE preview component */}
              <div className="lg:col-span-6">
                <LiveDashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" className="py-20 bg-surface/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-text">Portfolio-Grade BI Platform</h2>
              <p className="mt-3 text-muted text-base">
                Engineered for strict accuracy: deterministic computation meets intelligent recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Database,
                  title: 'Data Profiling',
                  desc: 'Comprehensive schema inference, data types, missing value percentages, cardinality, and distribution bounds.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Data Quality Score',
                  desc: '0–100 scored on completeness, uniqueness, validity, and consistency with one-click versioned remediation.',
                },
                {
                  icon: BarChart3,
                  title: 'KPI & Chart Recommender',
                  desc: 'Rule-based matching that suggests mathematically valid aggregations, time-series trends, and category charts.',
                },
                {
                  icon: LayoutDashboard,
                  title: 'Drag & Drop Builder',
                  desc: 'Flexible 12-column canvas with real-time responsive grid layout, theme tokens, and dynamic global filtering.',
                },
                {
                  icon: HelpCircle,
                  title: 'Ask Your Data',
                  desc: 'Deterministic natural language operations: top-N, rankings, totals, and group comparisons with full calculation transparency.',
                },
                {
                  icon: FileSpreadsheet,
                  title: 'Export (PNG/PDF/JSON)',
                  desc: 'Export high-definition dashboard images, printable PDF executive briefs, and formal BI specification JSON files.',
                },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-surface rounded-xl border border-border hover:border-primary/40 transition-colors shadow-subtle group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: How it Works */}
        <section id="how" className="py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-text">How it Works</h2>
              <p className="mt-3 text-muted text-base">
                Four deterministic stages from raw table files to decision-ready dashboards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {[
                { step: '01', title: 'Upload Data', text: 'Drag & drop your CSV or Excel files. Schemas and types are profiled instantly.' },
                { step: '02', title: 'Analyze & Clean', text: 'Inspect the 0–100 data quality score, identify outliers, and apply versioned fixes.' },
                { step: '03', title: 'Ask Questions', text: 'Query your data in plain English or generate a complete executive dashboard plan.' },
                { step: '04', title: 'Share & Export', text: 'Customize grid widgets, test multi-dimensional filters, and export high-res PNG or PDF.' },
              ].map((item, i) => (
                <div key={i} className="relative p-6 bg-surface rounded-xl border border-border">
                  <div className="text-3xl font-extrabold text-primary/20 mb-3 font-mono">{item.step}</div>
                  <h3 className="text-base font-semibold text-text mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Demo Section */}
        <section id="demo" className="py-20 bg-surface/50 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 shadow-card text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-ai/10 text-ai border border-ai/20">
                <Sparkles className="w-3.5 h-3.5" />
                Ask Your Data Live Engine
              </div>
              <h2 className="text-3xl font-bold text-text">Try "Ask Your Data" With No Setup</h2>
              <p className="text-muted text-base max-w-2xl mx-auto">
                Example question: <span className="font-semibold text-text">"Which region generated the highest revenue?"</span>
                <br />
                The system runs Pandas group-by aggregations, calculates share of total, and outputs verifiable metrics.
              </p>
              <div>
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3.5 rounded-lg shadow-subtle inline-flex items-center gap-2 transition-all"
                >
                  {demoLoading ? 'Opening Demo...' : 'Launch Instant Demo (Superstore)'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section id="faq" className="py-20 border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-text">Frequently Asked Questions</h2>
              <p className="mt-3 text-muted text-sm">Truthful technical answers about architecture and security.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-border rounded-xl bg-surface overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between text-base font-medium text-text hover:bg-surface-2/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 pt-1 text-sm text-muted leading-relaxed border-t border-border/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-text">InsightCanvas AI</span>
            <span className="text-xs text-muted ml-2">From Raw Data to Decision-Ready Dashboards</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted">
            <button onClick={() => scrollTo('features')} className="hover:text-text transition-colors">
              Features
            </button>
            <button onClick={handleTryDemo} className="hover:text-text transition-colors">
              Demo
            </button>
            <Link to="/login" className="hover:text-text transition-colors">
              Login
            </Link>
          </div>

          <div className="text-xs text-muted">
            © {new Date().getFullYear()} InsightCanvas AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
