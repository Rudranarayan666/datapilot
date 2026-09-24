from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Dataset schemas
class DatasetSummary(BaseModel):
    id: int
    name: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    version: int
    parent_id: Optional[int] = None
    is_sample: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    general_type: str  # numeric, categorical, datetime, boolean
    total_count: int
    unique_count: int
    missing_count: int
    missing_percentage: float
    min: Optional[Any] = None
    max: Optional[Any] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    top_value: Optional[Any] = None
    top_value_frequency: Optional[int] = None
    sample_values: List[Any] = []

class DatasetProfileResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    total_rows: int
    total_columns: int
    total_cells: int
    missing_cells: int
    missing_cells_percentage: float
    duplicate_rows: int
    duplicate_rows_percentage: float
    numeric_columns_count: int
    categorical_columns_count: int
    datetime_columns_count: int
    columns: List[ColumnProfile]

class QualityIssue(BaseModel):
    issue_type: str  # missing_values, duplicate_rows, constant_column, potential_outliers
    severity: str    # high, medium, low
    column: Optional[str] = None
    affected_rows: int
    affected_percentage: float
    sample_values: List[Any] = []
    suggested_fix: str
    fix_action: str

class DatasetQualityResponse(BaseModel):
    dataset_id: int
    overall_score: float  # 0 to 100
    scores: Dict[str, float]  # completeness, uniqueness, validity, consistency
    issues: List[QualityIssue]
    fixable_issues_count: int

# Cleaning fix request
class CleanFixRequest(BaseModel):
    actions: List[str]  # e.g. ["drop_duplicates", "impute_numeric_mean", "drop_missing_rows"]

# Widget schema inside Dashboard
class WidgetPosition(BaseModel):
    x: int
    y: int
    w: int
    h: int

class WidgetDataConfig(BaseModel):
    dimension: Optional[str] = None
    metric: Optional[str] = None
    aggregation: Optional[str] = "sum"  # sum, avg, count, min, max, distinct_count
    secondary_metric: Optional[str] = None
    chart_type: str  # kpi, line, bar, horizontal_bar, area, donut, scatter, table, text
    color_palette: Optional[List[str]] = None
    limit: Optional[int] = 10
    sort_order: Optional[str] = "desc"

class DashboardWidget(BaseModel):
    id: str
    title: str
    type: str  # kpi, line, bar, area, donut, scatter, table, text
    position: WidgetPosition
    data: WidgetDataConfig
    text_content: Optional[str] = None

class DashboardConfig(BaseModel):
    title: str
    description: Optional[str] = ""
    theme: str = "Midnight Analytics"
    filters: Dict[str, Any] = {}
    widgets: List[DashboardWidget]

class DashboardCreate(BaseModel):
    dataset_id: int
    title: str
    description: Optional[str] = ""
    theme: Optional[str] = "Midnight Analytics"
    config: DashboardConfig

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    config: Optional[DashboardConfig] = None

# Query Engine Request
class AggregationQuery(BaseModel):
    dataset_id: int
    dimension: Optional[str] = None
    metric: Optional[str] = None
    aggregation: str = "sum"  # sum, avg, count, min, max, count_distinct
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 10
    sort_order: Optional[str] = "desc"

# AI & Recommendations Schemas
class KPIRecommendation(BaseModel):
    id: str
    name: str
    metric_column: Optional[str] = None
    aggregation: str
    derived_formula: Optional[str] = None
    formatted_value: Optional[str] = None
    raw_value: Optional[float] = None
    reason: str

class ChartRecommendation(BaseModel):
    id: str
    title: str
    chart_type: str
    dimension: Optional[str] = None
    metric: Optional[str] = None
    aggregation: str
    reason: str

class AnalysisPlanResponse(BaseModel):
    question: str
    dataset_id: int
    detected_intent: str
    recommended_kpis: List[KPIRecommendation]
    recommended_charts: List[ChartRecommendation]
    dashboard_plan: DashboardConfig

class AskDataRequest(BaseModel):
    dataset_id: int
    question: str

class AskDataResponse(BaseModel):
    question: str
    operation: str
    answer_text: str
    calculation_basis: Dict[str, Any]
    chart_recommendation: Optional[ChartRecommendation] = None
    data_preview: Optional[List[Dict[str, Any]]] = None
    ai_explanation: Optional[str] = None

class DashboardChatRequest(BaseModel):
    command: str

class DashboardPatchResponse(BaseModel):
    applied: bool
    summary: str
    updated_config: DashboardConfig
