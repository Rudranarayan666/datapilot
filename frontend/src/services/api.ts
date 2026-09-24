const API_BASE = 'http://127.0.0.1:8000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('insightcanvas_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const err = await res.json();
      errorMsg = err.detail || JSON.stringify(err);
    } catch {
      errorMsg = res.statusText;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  signup: (data: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: () => request<any>('/auth/demo', { method: 'POST' }),

  // Datasets
  getDatasets: () => request<any[]>('/datasets'),
  uploadDataset: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/datasets/upload', { method: 'POST', body: formData });
  },
  getDatasetProfile: (id: number) => request<any>(`/datasets/${id}/profile`),
  getDatasetQuality: (id: number) => request<any>(`/datasets/${id}/quality`),
  cleanDataset: (id: number, actions: string[]) =>
    request<any>(`/datasets/${id}/clean`, { method: 'POST', body: JSON.stringify({ actions }) }),

  // Analytics
  getStatistics: (id: number) => request<any>(`/analytics/${id}/statistics`),
  getCorrelation: (id: number) => request<any>(`/analytics/${id}/correlation`),
  getOutliers: (id: number) => request<any>(`/analytics/${id}/outliers`),
  getHistogram: (id: number, column: string) => request<any>(`/analytics/${id}/histogram?column=${encodeURIComponent(column)}`),
  getInsights: (id: number) => request<any>(`/analytics/${id}/insights`),
  runQuery: (query: any) => request<any>('/analytics/query', { method: 'POST', body: JSON.stringify(query) }),

  // AI & Plan
  planAnalysis: (dataset_id: number, question: string) =>
    request<any>(`/ai/plan?dataset_id=${dataset_id}&question=${encodeURIComponent(question)}`, { method: 'POST' }),
  askData: (dataset_id: number, question: string) =>
    request<any>('/ai/ask', { method: 'POST', body: JSON.stringify({ dataset_id, question }) }),

  // Dashboards
  getDashboards: () => request<any[]>('/dashboards'),
  getDashboard: (id: number) => request<any>(`/dashboards/${id}`),
  createDashboard: (data: any) => request<any>('/dashboards', { method: 'POST', body: JSON.stringify(data) }),
  updateDashboard: (id: number, data: any) => request<any>(`/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDashboard: (id: number) => request<any>(`/dashboards/${id}`, { method: 'DELETE' }),
  patchDashboard: (id: number, command: string) =>
    request<any>(`/dashboards/${id}/chat`, { method: 'POST', body: JSON.stringify({ command }) }),

  // Export Spec
  getBiSpec: (id: number) => request<any>(`/export/spec/${id}`),
};
