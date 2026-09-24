from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def run_aggregation(
    df: pd.DataFrame,
    dimension: Optional[str] = None,
    metric: Optional[str] = None,
    aggregation: str = "sum",
    filters: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = 10,
    sort_order: Optional[str] = "desc"
) -> Dict[str, Any]:
    working_df = df.copy()

    # Apply filters
    if filters:
        for col, val in filters.items():
            if col in working_df.columns and val is not None and val != "All" and val != "":
                if isinstance(val, list):
                    if len(val) > 0:
                        working_df = working_df[working_df[col].isin(val)]
                elif isinstance(val, dict):
                    # date range or numeric range
                    if "start" in val and val["start"]:
                        working_df = working_df[working_df[col] >= val["start"]]
                    if "end" in val and val["end"]:
                        working_df = working_df[working_df[col] <= val["end"]]
                    if "min" in val and val["min"] is not None:
                        working_df = working_df[working_df[col] >= float(val["min"])]
                    if "max" in val and val["max"] is not None:
                        working_df = working_df[working_df[col] <= float(val["max"])]
                else:
                    working_df = working_df[working_df[col] == val]

    # Handle Single Metric (e.g. for KPI cards)
    if not dimension:
        if not metric or metric not in working_df.columns:
            return {"value": len(working_df), "formatted_value": f"{len(working_df):,}"}
            
        series = pd.to_numeric(working_df[metric], errors="coerce").dropna()
        if len(series) == 0:
            return {"value": 0, "formatted_value": "0"}
            
        if aggregation == "sum":
            val = float(series.sum())
        elif aggregation == "avg":
            val = float(series.mean())
        elif aggregation == "min":
            val = float(series.min())
        elif aggregation == "max":
            val = float(series.max())
        elif aggregation == "count_distinct":
            val = float(working_df[metric].nunique(dropna=True))
        else:
            val = float(series.count())
            
        val = round(val, 2)
        if "sales" in metric.lower() or "revenue" in metric.lower() or "profit" in metric.lower() or "spend" in metric.lower():
            fmt = f"${val:,.2f}"
        elif "margin" in metric.lower() or "rate" in metric.lower() or "pct" in metric.lower() or "roi" in metric.lower():
            fmt = f"{val:,.1f}%"
        else:
            fmt = f"{val:,.0f}" if val.is_integer() else f"{val:,.2f}"
            
        return {"value": val, "formatted_value": fmt, "count": len(working_df)}

    # Dimension grouping
    if dimension not in working_df.columns:
        return {"data": [], "total_groups": 0}

    # Handle date grouping
    dim_series = working_df[dimension]
    if pd.api.types.is_datetime64_any_dtype(dim_series) or dimension.lower().endswith("date"):
        try:
            working_df["__dt_parsed"] = pd.to_datetime(working_df[dimension], errors="coerce")
            working_df = working_df.dropna(subset=["__dt_parsed"])
            working_df["__period"] = working_df["__dt_parsed"].dt.to_period("M").astype(str)
            group_col = "__period"
        except Exception:
            group_col = dimension
    else:
        group_col = dimension

    if not metric or metric not in working_df.columns:
        # Just group by count
        grouped = working_df.groupby(group_col).size().reset_index(name="count")
        val_col = "count"
    else:
        num_s = pd.to_numeric(working_df[metric], errors="coerce")
        working_df["__metric_num"] = num_s
        
        if aggregation == "sum":
            grouped = working_df.groupby(group_col)["__metric_num"].sum().reset_index(name=metric)
        elif aggregation == "avg":
            grouped = working_df.groupby(group_col)["__metric_num"].mean().reset_index(name=metric)
        elif aggregation == "min":
            grouped = working_df.groupby(group_col)["__metric_num"].min().reset_index(name=metric)
        elif aggregation == "max":
            grouped = working_df.groupby(group_col)["__metric_num"].max().reset_index(name=metric)
        elif aggregation == "count_distinct":
            grouped = working_df.groupby(group_col)[metric].nunique().reset_index(name=metric)
        else:
            grouped = working_df.groupby(group_col)["__metric_num"].count().reset_index(name=metric)
        val_col = metric

    # Sort
    ascending = (sort_order == "asc")
    if group_col == "__period":
        grouped = grouped.sort_values(by=group_col, ascending=True)
    else:
        grouped = grouped.sort_values(by=val_col, ascending=ascending)

    total_groups = len(grouped)
    if limit and limit > 0:
        grouped = grouped.head(limit)

    result_data = []
    for _, row in grouped.iterrows():
        val = row[val_col]
        rounded_val = round(float(val), 2) if pd.notna(val) else 0.0
        result_data.append({
            dimension: str(row[group_col]),
            "value": rounded_val,
            metric if metric else "count": rounded_val
        })

    return {
        "dimension": dimension,
        "metric": metric,
        "aggregation": aggregation,
        "data": result_data,
        "total_groups": total_groups
    }
