import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DatasetSummary } from '../../types';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Loader2,
  HardDrive
} from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = () => {
    setLoading(true);
    api.getDatasets()
      .then(setDatasets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploading(true);

    try {
      setUploadStage('Reading file bytes...');
      await new Promise((r) => setTimeout(r, 300));

      setUploadStage('Detecting schema and column types...');
      await new Promise((r) => setTimeout(r, 400));

      setUploadStage('Auditing data quality & completeness...');
      await new Promise((r) => setTimeout(r, 400));

      setUploadStage('Calculating statistical metrics...');
      await api.uploadDataset(file);

      fetchDatasets();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
      setUploadStage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Dataset Manager</h1>
        <p className="text-sm text-muted mt-1">
          Upload CSV or Excel files, run automated profiling audits, and apply non-destructive versioned fixes.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-xl p-8 bg-surface text-center hover:border-primary/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-text">
              {uploading ? uploadStage : 'Upload your dataset'}
            </h3>
            <p className="text-xs text-muted mt-1">
              Drag and drop CSV or Excel files here, or browse files on your device (up to 25MB).
            </p>
          </div>

          {!uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-subtle transition-colors"
            >
              Select File
            </button>
          )}

          {uploadError && (
            <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-text">Datasets ({datasets.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted text-sm">Loading datasets...</div>
        ) : (
          <div className="divide-y divide-border">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-2/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-primary shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/datasets/${ds.id}`}
                        className="text-sm font-semibold text-text hover:text-primary transition-colors"
                      >
                        {ds.name}
                      </Link>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-muted border border-border">
                        v{ds.version}
                      </span>
                      {ds.is_sample && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
                          Sample
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-3 mt-1">
                      <span>{ds.row_count.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{ds.column_count} columns</span>
                      <span>•</span>
                      <span>{(ds.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Link
                    to={`/datasets/${ds.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text bg-surface-2 hover:bg-border/60 border border-border transition-colors"
                  >
                    <span>Profile & Quality</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
