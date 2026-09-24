from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Dashboard
from app.schemas.schemas import DashboardConfig

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/spec/{dashboard_id}")
def export_bi_spec(dashboard_id: int, db: Session = Depends(get_db)):
    """
    Generates a formal BI Dashboard Specification JSON containing
    widgets, metrics, dimensions, filters, and calculation formulas.
    Never claims native Power BI / Tableau export.
    """
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    cfg = dashboard.config
    widgets_spec = []
    for w in cfg.get("widgets", []):
        w_data = w.get("data", {})
        widgets_spec.append({
            "widget_id": w.get("id"),
            "title": w.get("title"),
            "visual_type": w.get("type"),
            "metric": w_data.get("metric"),
            "dimension": w_data.get("dimension"),
            "aggregation": w_data.get("aggregation", "sum"),
            "formula": f"{w_data.get('aggregation', 'SUM').upper()}({w_data.get('metric', 'Records')})",
            "grid_layout": w.get("position")
        })

    spec = {
        "specification_format": "InsightCanvas BI Spec v1.0",
        "exported_at": str(dashboard.updated_at),
        "dashboard_id": dashboard.id,
        "title": dashboard.title,
        "description": dashboard.description,
        "theme": dashboard.theme,
        "dataset_id": dashboard.dataset_id,
        "dataset_name": dashboard.dataset.name if dashboard.dataset else None,
        "global_filters": cfg.get("filters", {}),
        "widgets": widgets_spec,
        "notes": "Compatible with standard BI data modeling pipelines (SQL/dbt/Metabase)."
    }
    return spec
