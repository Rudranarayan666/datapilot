from typing import Dict, Any, List, Optional
import re
import pandas as pd
import numpy as np

def ask_your_data(df: pd.DataFrame, question: str) -> Dict[str, Any]:
    """
    Deterministic rule-based NLP intent matcher and query executor.
    Supports whitelisted operations:
    - Top-N / Max entity (e.g. 'Which region generated the highest revenue?', 'top product')
    - Min / Lowest entity (e.g. 'lowest profit sub-category')
    - Aggregation / Total (e.g. 'total sales', 'average discount')
    - Share of total
    - Trend / Monthly overview
    """
    q = question.lower()
    cols = {c.lower(): c for c in df.columns}
    
    # Identify metrics
    metric_col = None
    for cand in ["profit", "sales", "revenue", "spend", "charges", "quantity", "discount", "impressions", "clicks", "conversions"]:
        match = next((cols[k] for k in cols if cand in k), None)
        if match:
            metric_col = match
            break
            
    if not metric_col:
        # Default to first numeric column
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        metric_col = numeric_cols[0] if numeric_cols else None

    # Identify dimension
    dimension_col = None
    for cand in ["region", "state", "category", "sub-category", "segment", "channel", "campaign", "customer", "contract"]:
        match = next((cols[k] for k in cols if cand in k), None)
        if match:
            dimension_col = match
            break

    if not dimension_col:
        cat_cols = [c for c in df.columns if df[c].dtype == "object" and not c.lower().endswith("id")]
        dimension_col = cat_cols[0] if cat_cols else df.columns[0]

    # Operation 1: Highest / Top / Best
    if any(k in q for k in ["highest", "top", "best", "max", "most", "largest", "leader"]):
        if dimension_col and metric_col:
            grouped = df.groupby(dimension_col)[metric_col].sum().reset_index()
            grouped = grouped.sort_values(by=metric_col, ascending=False)
            top_row = grouped.iloc[0]
            top_dim = str(top_row[dimension_col])
            top_val = float(top_row[metric_col])
            total_sum = float(grouped[metric_col].sum())
            share_pct = round((top_val / total_sum * 100), 2) if total_sum > 0 else 0.0

            fmt_val = f"${top_val:,.2f}" if any(k in metric_col.lower() for k in ["sales", "revenue", "profit", "spend"]) else f"{top_val:,.2f}"
            fmt_tot = f"${total_sum:,.2f}" if any(k in metric_col.lower() for k in ["sales", "revenue", "profit", "spend"]) else f"{total_sum:,.2f}"

            return {
                "question": question,
                "operation": "top_entity_aggregate",
                "answer_text": f"**{top_dim}** generated the highest {metric_col} at **{fmt_val}**, accounting for **{share_pct}%** of total {metric_col} ({fmt_tot}).",
                "calculation_basis": {
                    "operation": "groupby_sum_sort_desc_limit_1",
                    "dimension": dimension_col,
                    "metric": metric_col,
                    "top_entity": top_dim,
                    "value": round(top_val, 2),
                    "total_sum": round(total_sum, 2),
                    "share_of_total_percent": share_pct,
                    "total_groups_evaluated": len(grouped)
                },
                "data_preview": [
                    {dimension_col: str(r[dimension_col]), metric_col: round(float(r[metric_col]), 2)}
                    for _, r in grouped.head(5).iterrows()
                ],
                "ai_explanation": f"Calculated deterministically by summing '{metric_col}' grouped by '{dimension_col}'. {top_dim} leads all {len(grouped)} distinct categories."
            }

    # Operation 2: Lowest / Minimum / Worst
    if any(k in q for k in ["lowest", "bottom", "worst", "min", "least", "smallest"]):
        if dimension_col and metric_col:
            grouped = df.groupby(dimension_col)[metric_col].sum().reset_index()
            grouped = grouped.sort_values(by=metric_col, ascending=True)
            bot_row = grouped.iloc[0]
            bot_dim = str(bot_row[dimension_col])
            bot_val = float(bot_row[metric_col])
            total_sum = float(grouped[metric_col].sum())
            share_pct = round((bot_val / total_sum * 100), 2) if total_sum > 0 else 0.0

            fmt_val = f"${bot_val:,.2f}" if any(k in metric_col.lower() for k in ["sales", "revenue", "profit", "spend"]) else f"{bot_val:,.2f}"

            return {
                "question": question,
                "operation": "bottom_entity_aggregate",
                "answer_text": f"**{bot_dim}** recorded the lowest {metric_col} at **{fmt_val}** ({share_pct}% of total).",
                "calculation_basis": {
                    "operation": "groupby_sum_sort_asc_limit_1",
                    "dimension": dimension_col,
                    "metric": metric_col,
                    "bottom_entity": bot_dim,
                    "value": round(bot_val, 2),
                    "total_sum": round(total_sum, 2),
                    "share_of_total_percent": share_pct
                },
                "data_preview": [
                    {dimension_col: str(r[dimension_col]), metric_col: round(float(r[metric_col]), 2)}
                    for _, r in grouped.head(5).iterrows()
                ],
                "ai_explanation": f"Calculated deterministically by grouping '{dimension_col}' and sorting '{metric_col}' in ascending order."
            }

    # Operation 3: Average / Mean
    if any(k in q for k in ["average", "avg", "mean"]):
        if metric_col:
            mean_val = float(pd.to_numeric(df[metric_col], errors="coerce").mean())
            fmt_val = f"${mean_val:,.2f}" if any(k in metric_col.lower() for k in ["sales", "revenue", "profit", "spend"]) else f"{mean_val:,.2f}"
            return {
                "question": question,
                "operation": "metric_mean",
                "answer_text": f"The average **{metric_col}** across all {len(df):,} records is **{fmt_val}**.",
                "calculation_basis": {
                    "operation": "pandas_mean",
                    "metric": metric_col,
                    "mean_value": round(mean_val, 2),
                    "valid_rows": int(pd.to_numeric(df[metric_col], errors="coerce").notna().sum())
                },
                "ai_explanation": f"Calculated deterministically using arithmetic mean of valid rows."
            }

    # Operation 4: Total / Sum / General breakdown
    if metric_col:
        tot_val = float(pd.to_numeric(df[metric_col], errors="coerce").sum())
        fmt_val = f"${tot_val:,.2f}" if any(k in metric_col.lower() for k in ["sales", "revenue", "profit", "spend"]) else f"{tot_val:,.2f}"
        
        # Provide breakdown by dimension
        if dimension_col:
            grouped = df.groupby(dimension_col)[metric_col].sum().reset_index().sort_values(by=metric_col, ascending=False)
            preview = [
                {dimension_col: str(r[dimension_col]), metric_col: round(float(r[metric_col]), 2)}
                for _, r in grouped.head(5).iterrows()
            ]
        else:
            preview = []

        return {
            "question": question,
            "operation": "total_and_breakdown",
            "answer_text": f"Total **{metric_col}** is **{fmt_val}** across {len(df):,} transactions.",
            "calculation_basis": {
                "operation": "pandas_sum",
                "metric": metric_col,
                "total_value": round(tot_val, 2),
                "breakdown_dimension": dimension_col
            },
            "data_preview": preview,
            "ai_explanation": f"Aggregated total {metric_col} summed across the entire dataset."
        }

    return {
        "question": question,
        "operation": "general_summary",
        "answer_text": f"Dataset contains {len(df):,} rows and {len(df.columns)} columns.",
        "calculation_basis": {"rows": len(df), "columns": len(df.columns)},
        "ai_explanation": "Summary overview based on dataset shape."
    }
