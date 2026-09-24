export type ThemeMode = 'dark' | 'light';

export interface User {
  id: number;
  name: string;
  email: string;
  is_demo?: boolean;
}

export interface DatasetSummary {
  id: number;
  name: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  version: number;
  parent_id?: number | null;
  is_sample: boolean;
  created_at: string;
}

export interface ColumnProfile {
  name: string;
  dtype: string;
  general_type: 'numeric' | 'categorical' | 'datetime' | 'boolean';
  total_count: number;
  unique_count: number;
  missing_count: number;
  missing_percentage: number;
  min?: number | string | null;
  max?: number | string | null;
  mean?: number | null;
  median?: number | null;
  std?: number | null;
  top_value?: string | null;
  top_value_frequency?: number | null;
  sample_values: any[];
}

export interface DatasetProfile {
  dataset_id: number;
  dataset_name: string;
  total_rows: number;
  total_columns: number;
  total_cells: number;
  missing_cells: number;
  missing_cells_percentage: number;
  duplicate_rows: number;
  duplicate_rows_percentage: number;
  numeric_columns_count: number;
  categorical_columns_count: number;
  datetime_columns_count: number;
  columns: ColumnProfile[];
}

export interface QualityIssue {
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  column: string | null;
  affected_rows: number;
  affected_percentage: number;
  sample_values: any[];
  suggested_fix: string;
  fix_action: string;
}

export interface DatasetQuality {
  dataset_id: number;
  overall_score: number;
  scores: {
    completeness: number;
    uniqueness: number;
    validity: number;
    consistency: number;
  };
  issues: QualityIssue[];
  fixable_issues_count: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetDataConfig {
  dimension?: string | null;
  metric?: string | null;
  aggregation?: string;
  secondary_metric?: string | null;
  chart_type: string; // kpi, line, bar, horizontal_bar, area, donut, scatter, table, text
  color_palette?: string[] | null;
  limit?: number;
  sort_order?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  position: WidgetPosition;
  data: WidgetDataConfig;
  text_content?: string;
}

export interface DashboardConfig {
  title: string;
  description?: string;
  theme: string;
  filters: Record<string, any>;
  widgets: DashboardWidget[];
}

export interface Dashboard {
  id: number;
  dataset_id: number;
  dataset_name?: string;
  title: string;
  description?: string;
  theme: string;
  config: DashboardConfig;
  created_at?: string;
  updated_at?: string;
}

export interface KPIRecommendation {
  id: string;
  name: string;
  metric_column?: string | null;
  aggregation: string;
  derived_formula?: string | null;
  formatted_value?: string;
  raw_value?: number;
  reason: string;
}

export interface ChartRecommendation {
  id: string;
  title: string;
  chart_type: string;
  dimension?: string | null;
  metric?: string | null;
  aggregation: string;
  reason: string;
}

export interface AnalysisPlan {
  question: string;
  dataset_id: number;
  detected_intent: string;
  recommended_kpis: KPIRecommendation[];
  recommended_charts: ChartRecommendation[];
  dashboard_plan: DashboardConfig;
}

export interface AskDataResponse {
  question: string;
  operation: string;
  answer_text: string;
  calculation_basis: Record<string, any>;
  chart_recommendation?: ChartRecommendation | null;
  data_preview?: any[];
  ai_explanation?: string;
}

export interface BusinessInsight {
  type: 'Trend' | 'Comparison' | 'Anomaly' | 'Opportunity' | 'Warning';
  title: string;
  metric: string;
  value: string;
  comparison: string;
  calculation_basis: string;
}
