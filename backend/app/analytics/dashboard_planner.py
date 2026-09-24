from typing import Dict, Any, List
import pandas as pd
from app.analytics.recommender import recommend_kpis, recommend_charts

def generate_dashboard_plan(df: pd.DataFrame, question: str, theme: str = "Midnight Analytics") -> Dict[str, Any]:
    """
    Transforms a business question + dataset into a validated DashboardConfig JSON.
    Generates recommended KPIs and charts, and places them into a 12-column grid layout.
    """
    kpis = recommend_kpis(df)
    charts = recommend_charts(df)
    
    widgets: List[Dict[str, Any]] = []
    
    # Place top 3 or 4 KPIs along the top row (h=3, w=3 or w=4)
    top_kpis = kpis[:4]
    kpi_width = 12 // max(1, len(top_kpis))
    
    for idx, kpi in enumerate(top_kpis):
        widgets.append({
            "id": f"kpi_{idx+1}",
            "title": kpi["name"],
            "type": "kpi",
            "position": {
                "x": idx * kpi_width,
                "y": 0,
                "w": kpi_width,
                "h": 3
            },
            "data": {
                "metric": kpi["metric_column"],
                "aggregation": kpi["aggregation"] if kpi["aggregation"] != "derived" else "sum",
                "chart_type": "kpi"
            }
        })

    # Place charts in subsequent rows
    current_y = 3
    if len(charts) >= 1:
        # First chart: Trend line (full width or w=8)
        trend = charts[0]
        widgets.append({
            "id": "chart_1",
            "title": trend["title"],
            "type": trend["chart_type"],
            "position": {
                "x": 0,
                "y": current_y,
                "w": 8 if len(charts) > 1 else 12,
                "h": 7
            },
            "data": {
                "dimension": trend["dimension"],
                "metric": trend["metric"],
                "aggregation": trend["aggregation"],
                "chart_type": trend["chart_type"]
            }
        })
        
        # Second chart next to it: Donut or Bar
        if len(charts) > 1:
            sec = charts[1]
            widgets.append({
                "id": "chart_2",
                "title": sec["title"],
                "type": sec["chart_type"],
                "position": {
                    "x": 8,
                    "y": current_y,
                    "w": 4,
                    "h": 7
                },
                "data": {
                    "dimension": sec["dimension"],
                    "metric": sec["metric"],
                    "aggregation": sec["aggregation"],
                    "chart_type": sec["chart_type"],
                    "limit": 8
                }
            })
        current_y += 7

    # Third and Fourth charts in next row
    if len(charts) > 2:
        for idx, ch in enumerate(charts[2:4]):
            widgets.append({
                "id": f"chart_{idx+3}",
                "title": ch["title"],
                "type": ch["chart_type"],
                "position": {
                    "x": idx * 6,
                    "y": current_y,
                    "w": 6,
                    "h": 7
                },
                "data": {
                    "dimension": ch["dimension"],
                    "metric": ch["metric"],
                    "aggregation": ch["aggregation"],
                    "chart_type": ch["chart_type"],
                    "limit": 10
                }
            })
        current_y += 7

    # Build default filter options from categorical and date columns
    filter_config: Dict[str, Any] = {}
    for c in df.columns:
        if "region" in c.lower() or "segment" in c.lower() or "category" in c.lower() or "channel" in c.lower():
            filter_config[c] = "All"
            break

    dashboard_config = {
        "title": "Executive Sales & Performance Dashboard" if "sale" in question.lower() or "revenue" in question.lower() else "Executive Analytics Overview",
        "description": f"Generated deterministically from question: '{question}'",
        "theme": theme,
        "filters": filter_config,
        "widgets": widgets
    }

    return {
        "question": question,
        "detected_intent": "executive_overview",
        "recommended_kpis": kpis,
        "recommended_charts": charts,
        "dashboard_plan": dashboard_config
    }
