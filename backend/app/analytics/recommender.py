from typing import List, Dict, Any, Optional
import pandas as pd
from app.analytics.profiler import detect_column_type

def recommend_kpis(df: pd.DataFrame) -> List[Dict[str, Any]]:
    kpis = []
    col_map = {c.lower(): c for c in df.columns}
    
    # 1. Total Revenue / Sales / Spend
    sales_col = next((col_map[c] for c in col_map if any(k in c for k in ["sales", "revenue", "spend", "charges"])), None)
    if sales_col and pd.api.types.is_numeric_dtype(df[sales_col]):
        total_sales = float(pd.to_numeric(df[sales_col], errors="coerce").sum())
        kpis.append({
            "id": "kpi_revenue",
            "name": f"Total {sales_col}",
            "metric_column": sales_col,
            "aggregation": "sum",
            "raw_value": round(total_sales, 2),
            "formatted_value": f"${total_sales:,.2f}",
            "reason": f"Core volume metric identified from column '{sales_col}'."
        })

    # 2. Total Profit
    profit_col = next((col_map[c] for c in col_map if "profit" in c or "margin" in c), None)
    if profit_col and pd.api.types.is_numeric_dtype(df[profit_col]):
        total_profit = float(pd.to_numeric(df[profit_col], errors="coerce").sum())
        kpis.append({
            "id": "kpi_profit",
            "name": f"Total {profit_col}",
            "metric_column": profit_col,
            "aggregation": "sum",
            "raw_value": round(total_profit, 2),
            "formatted_value": f"${total_profit:,.2f}",
            "reason": f"Bottom-line profitability metric identified from column '{profit_col}'."
        })

    # 3. Derived: Profit Margin % = SUM(Profit) / SUM(Sales)
    if sales_col and profit_col and pd.api.types.is_numeric_dtype(df[sales_col]) and pd.api.types.is_numeric_dtype(df[profit_col]):
        tot_sales = float(pd.to_numeric(df[sales_col], errors="coerce").sum())
        tot_profit = float(pd.to_numeric(df[profit_col], errors="coerce").sum())
        if tot_sales > 0:
            margin = round((tot_profit / tot_sales) * 100, 2)
            kpis.append({
                "id": "kpi_profit_margin",
                "name": "Profit Margin",
                "metric_column": profit_col,
                "aggregation": "derived",
                "derived_formula": f"SUM({profit_col}) / SUM({sales_col})",
                "raw_value": margin,
                "formatted_value": f"{margin:.1f}%",
                "reason": f"Derived financial ratio: Total {profit_col} divided by Total {sales_col}."
            })

    # 4. Total Orders / Transactions
    order_col = next((col_map[c] for c in col_map if any(k in c for k in ["order", "transaction", "id", "customer"])), None)
    if order_col:
        order_count = int(df[order_col].nunique(dropna=True))
        kpis.append({
            "id": "kpi_orders",
            "name": f"Distinct {order_col}s",
            "metric_column": order_col,
            "aggregation": "count_distinct",
            "raw_value": float(order_count),
            "formatted_value": f"{order_count:,}",
            "reason": f"Unique entity count indicating transaction volume."
        })
    else:
        # Fallback to total rows
        kpis.append({
            "id": "kpi_records",
            "name": "Total Records",
            "metric_column": None,
            "aggregation": "count",
            "raw_value": float(len(df)),
            "formatted_value": f"{len(df):,}",
            "reason": "Baseline record count across the entire dataset."
        })

    # 5. Derived: AOV (Average Order Value) if sales and order_id exist
    if sales_col and order_col and pd.api.types.is_numeric_dtype(df[sales_col]):
        tot_sales = float(pd.to_numeric(df[sales_col], errors="coerce").sum())
        order_count = int(df[order_col].nunique(dropna=True))
        if order_count > 0:
            aov = round(tot_sales / order_count, 2)
            kpis.append({
                "id": "kpi_aov",
                "name": "Average Order Value (AOV)",
                "metric_column": sales_col,
                "aggregation": "derived",
                "derived_formula": f"SUM({sales_col}) / COUNT(DISTINCT {order_col})",
                "raw_value": aov,
                "formatted_value": f"${aov:,.2f}",
                "reason": f"Derived efficiency metric measuring revenue per unique {order_col}."
            })

    return kpis

def recommend_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    charts = []
    
    date_cols = []
    numeric_cols = []
    cat_cols = []
    
    for c in df.columns:
        _, g_type = detect_column_type(df[c])
        if g_type == "datetime":
            date_cols.append(c)
        elif g_type == "numeric":
            numeric_cols.append(c)
        elif g_type == "categorical":
            # Prefer categories with reasonable cardinality (2 - 50)
            if 2 <= df[c].nunique() <= 60:
                cat_cols.append(c)

    primary_metric = next((c for c in numeric_cols if any(k in c.lower() for k in ["sales", "revenue", "spend", "profit", "amount"])), numeric_cols[0] if numeric_cols else None)
    secondary_metric = next((c for c in numeric_cols if c != primary_metric), None)

    # 1. Date + Numeric -> Line chart (Trends over time)
    if date_cols and primary_metric:
        charts.append({
            "id": "chart_trend",
            "title": f"Monthly {primary_metric} Trend",
            "chart_type": "line",
            "dimension": date_cols[0],
            "metric": primary_metric,
            "aggregation": "sum",
            "reason": f"Datetime column '{date_cols[0]}' detected paired with metric '{primary_metric}'."
        })

    # 2. Categorical + Numeric -> Bar / Horizontal Bar (Category breakdown)
    if cat_cols and primary_metric:
        # Choose category like Region or Segment or Category
        pref_cat = next((c for c in cat_cols if any(k in c.lower() for k in ["region", "state", "channel", "category", "segment"])), cat_cols[0])
        charts.append({
            "id": "chart_category_bar",
            "title": f"{primary_metric} by {pref_cat}",
            "chart_type": "bar",
            "dimension": pref_cat,
            "metric": primary_metric,
            "aggregation": "sum",
            "reason": f"High-contrast categorical breakdown across {df[pref_cat].nunique()} discrete entities."
        })
        
        # Another categorical -> Donut / Area
        other_cats = [c for c in cat_cols if c != pref_cat]
        if other_cats:
            donut_cat = next((c for c in other_cats if df[c].nunique() <= 6), other_cats[0])
            charts.append({
                "id": "chart_segment_donut",
                "title": f"{primary_metric} Share by {donut_cat}",
                "chart_type": "donut",
                "dimension": donut_cat,
                "metric": primary_metric,
                "aggregation": "sum",
                "reason": f"Low-cardinality dimension ideal for part-to-whole share analysis."
            })

    # 3. Two Numerics -> Scatter / Correlation
    if primary_metric and secondary_metric:
        charts.append({
            "id": "chart_scatter_rel",
            "title": f"{primary_metric} vs. {secondary_metric}",
            "chart_type": "scatter",
            "dimension": primary_metric,
            "metric": secondary_metric,
            "aggregation": "raw",
            "reason": f"Two continuous numeric variables for correlation and dispersion analysis."
        })

    return charts
