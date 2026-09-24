from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Dashboard, Dataset
from app.schemas.schemas import DashboardCreate, DashboardUpdate, DashboardConfig, DashboardChatRequest, DashboardPatchResponse
from app.services.data_service import get_dataset_dataframe
from app.analytics.dashboard_planner import generate_dashboard_plan

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])

@router.get("", response_model=List[Dict[str, Any]])
def list_dashboards(db: Session = Depends(get_db)):
    dashboards = db.query(Dashboard).order_by(Dashboard.updated_at.desc()).all()
    res = []
    for d in dashboards:
        res.append({
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "dataset_id": d.dataset_id,
            "dataset_name": d.dataset.name if d.dataset else "Unknown",
            "theme": d.theme,
            "widget_count": len(d.config.get("widgets", [])) if d.config else 0,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        })
    return res

@router.post("", response_model=Dict[str, Any])
def create_dashboard(data: DashboardCreate, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == data.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    dashboard = Dashboard(
        dataset_id=data.dataset_id,
        title=data.title,
        description=data.description,
        theme=data.theme or "Midnight Analytics",
        config=data.config.model_dump()
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    
    return {
        "id": dashboard.id,
        "dataset_id": dashboard.dataset_id,
        "title": dashboard.title,
        "description": dashboard.description,
        "theme": dashboard.theme,
        "config": dashboard.config
    }

@router.get("/{id}")
def get_dashboard(id: int, db: Session = Depends(get_db)):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return {
        "id": dashboard.id,
        "dataset_id": dashboard.dataset_id,
        "dataset_name": dashboard.dataset.name if dashboard.dataset else "",
        "title": dashboard.title,
        "description": dashboard.description,
        "theme": dashboard.theme,
        "config": dashboard.config,
        "created_at": dashboard.created_at,
        "updated_at": dashboard.updated_at
    }

@router.put("/{id}")
def update_dashboard(id: int, data: DashboardUpdate, db: Session = Depends(get_db)):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    if data.title is not None:
        dashboard.title = data.title
    if data.description is not None:
        dashboard.description = data.description
    if data.theme is not None:
        dashboard.theme = data.theme
    if data.config is not None:
        dashboard.config = data.config.model_dump()
        
    db.commit()
    db.refresh(dashboard)
    return {
        "id": dashboard.id,
        "dataset_id": dashboard.dataset_id,
        "title": dashboard.title,
        "description": dashboard.description,
        "theme": dashboard.theme,
        "config": dashboard.config
    }

@router.delete("/{id}")
def delete_dashboard(id: int, db: Session = Depends(get_db)):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.delete(dashboard)
    db.commit()
    return {"message": "Dashboard deleted successfully"}

@router.post("/{id}/chat", response_model=DashboardPatchResponse)
def assistant_patch_dashboard(id: int, req: DashboardChatRequest, db: Session = Depends(get_db)):
    """
    Interprets user natural commands like 'change regional chart to horizontal bars'
    and applies validated patches to the configuration JSON.
    """
    dashboard = db.query(Dashboard).filter(Dashboard.id == id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    config = dict(dashboard.config)
    widgets = list(config.get("widgets", []))
    cmd = req.command.lower()
    summary = "No changes applied"
    applied = False

    # 1. "change ... to horizontal bars" or "change to bar"
    if "horizontal" in cmd and "bar" in cmd:
        for w in widgets:
            if w.get("type") in ["bar", "line", "area"]:
                w["type"] = "horizontal_bar"
                w["data"]["chart_type"] = "horizontal_bar"
                summary = f"Converted widget '{w['title']}' to horizontal bar chart."
                applied = True
                break
    elif "bar" in cmd and not "horizontal" in cmd:
        for w in widgets:
            if w.get("type") in ["horizontal_bar", "line", "area"]:
                w["type"] = "bar"
                w["data"]["chart_type"] = "bar"
                summary = f"Converted widget '{w['title']}' to bar chart."
                applied = True
                break
    elif "line" in cmd:
        for w in widgets:
            if w.get("type") in ["bar", "horizontal_bar", "area"]:
                w["type"] = "line"
                w["data"]["chart_type"] = "line"
                summary = f"Converted widget '{w['title']}' to line chart."
                applied = True
                break
    elif "area" in cmd:
        for w in widgets:
            if w.get("type") in ["bar", "line"]:
                w["type"] = "area"
                w["data"]["chart_type"] = "area"
                summary = f"Converted widget '{w['title']}' to area chart."
                applied = True
                break
    # 2. "add profit margin kpi"
    elif "add" in cmd and "profit margin" in cmd:
        new_kpi = {
            "id": f"kpi_{len(widgets)+1}",
            "title": "Profit Margin",
            "type": "kpi",
            "position": {"x": 0, "y": 0, "w": 3, "h": 3},
            "data": {"metric": "Profit", "aggregation": "avg", "chart_type": "kpi"}
        }
        widgets.insert(0, new_kpi)
        summary = "Added new Profit Margin KPI widget to the top of dashboard."
        applied = True
    # 3. "theme to ocean blue" / "theme to executive light"
    elif "ocean" in cmd:
        config["theme"] = "Ocean Blue"
        dashboard.theme = "Ocean Blue"
        summary = "Updated dashboard theme to 'Ocean Blue'."
        applied = True
    elif "executive" in cmd or "light" in cmd:
        config["theme"] = "Executive Light"
        dashboard.theme = "Executive Light"
        summary = "Updated dashboard theme to 'Executive Light'."
        applied = True
    elif "midnight" in cmd or "dark" in cmd:
        config["theme"] = "Midnight Analytics"
        dashboard.theme = "Midnight Analytics"
        summary = "Updated dashboard theme to 'Midnight Analytics'."
        applied = True

    if applied:
        config["widgets"] = widgets
        dashboard.config = config
        db.commit()
        db.refresh(dashboard)

    return {
        "applied": applied,
        "summary": summary,
        "updated_config": config
    }
