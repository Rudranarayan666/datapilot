import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DatasetSummary, AskDataResponse } from '../../types';
import {
  Sparkles,
  Send,
  Calculator,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Info,
  MessageCircle,
  Lightbulb
} from 'lucide-react';

export const AskYourDataPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number>(1);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskDataResponse | null>(null);
  const [showCalcBasis, setShowCalcBasis] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: AskDataResponse }[]>([]);

  useEffect(() => {
    api.getDatasets().then((ds) => {
      setDatasets(ds);
      if (ds.length > 0) setSelectedDatasetId(ds[0].id);
    });
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setShowCalcBasis(false);
    try {
      const res = await api.askData(selectedDatasetId, question);
      setAnswer(res);
      setHistory((prev) => [{ q: question, a: res }, ...prev].slice(0, 10));
    } catch (err: any) {
      console.error('Ask failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    'Which region generated the highest revenue?',
    'What is the average discount across all orders?',
    'Which category has the lowest profit margin?',
    'What is the total sales for Technology products?',
    'Which segment contributes the most to total revenue?',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-ai" />
          Ask Your Data
        </h1>
        <p className="text-sm text-muted mt-1">
          Deterministic rule-based query engine: top-N, group-by aggregations, totals, and rankings with
          full calculation transparency. No LLM required.
        </p>
      </div>

      {/* Dataset Selector + Question Input */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="space-y-1.5 w-full sm:w-48">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Dataset
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Business Question
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="e.g. Which region generated the highest revenue?"
                className="flex-1 px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ai"
              />
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="px-5 py-2 bg-ai hover:bg-ai-hover text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 shadow-subtle"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Computing...' : 'Ask'}
              </button>
            </div>
          </div>
        </div>

        {/* Example questions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-[11px] text-muted font-medium py-1">Try:</span>
          {exampleQuestions.map((eq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(eq);
              }}
              className="px-2.5 py-1 bg-surface-2 border border-border rounded-full text-[11px] text-muted hover:text-text hover:border-primary/40 transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Panel */}
      {answer && (
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          {/* Answer Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 text-[11px] text-muted font-medium uppercase tracking-wider mb-3">
              <Calculator className="w-3.5 h-3.5 text-ai" />
              <span>Engine Operation: {answer.operation.replace(/_/g, ' ')}</span>
            </div>

            {/* Main Answer */}
            <div
              className="text-base text-text leading-relaxed font-medium"
              dangerouslySetInnerHTML={{
                __html: answer.answer_text
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>'),
              }}
            />

            {/* AI Explanation */}
            {answer.ai_explanation && (
              <div className="mt-4 p-3 bg-ai/5 border border-ai/20 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-ai shrink-0 mt-0.5" />
                <p className="text-xs text-text">{answer.ai_explanation}</p>
              </div>
            )}
          </div>

          {/* Data Preview */}
          {answer.data_preview && answer.data_preview.length > 0 && (
            <div className="p-6 border-b border-border">
              <h4 className="text-xs font-semibold text-text mb-3 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                Ranked Breakdown ({answer.data_preview.length} entities)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-border text-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2">#</th>
                      {Object.keys(answer.data_preview[0]).map((key) => (
                        <th key={key} className="p-2">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {answer.data_preview.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-primary/5' : 'hover:bg-surface-2/30'}>
                        <td className="p-2 font-mono text-muted">{i + 1}</td>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="p-2 font-medium text-text">
                            {typeof val === 'number' ? val.toLocaleString() : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Calculation Panel */}
          <div className="px-6 py-3">
            <button
              onClick={() => setShowCalcBasis(!showCalcBasis)}
              className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <Info className="w-3.5 h-3.5" />
              {showCalcBasis ? 'Hide Calculation Basis' : 'View Calculation Basis'}
              {showCalcBasis ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {showCalcBasis && (
              <div className="mt-3 p-4 bg-surface-2 rounded-lg border border-border font-mono text-xs text-muted overflow-x-auto">
                <pre>{JSON.stringify(answer.calculation_basis, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Q&A History */}
      {history.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-muted" />
            Recent Queries ({history.length - 1})
          </h3>
          {history.slice(1).map((item, idx) => (
            <div key={idx} className="p-4 bg-surface border border-border rounded-xl shadow-subtle">
              <div className="text-xs font-semibold text-muted mb-1">Q: {item.q}</div>
              <div
                className="text-sm text-text"
                dangerouslySetInnerHTML={{
                  __html: item.a.answer_text.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-primary font-bold">$1</strong>'
                  ),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
