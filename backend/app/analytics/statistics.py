from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.analytics.profiler import detect_column_type

def get_descriptive_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if not numeric_cols:
        return {"columns": []}
    
    desc = df[numeric_cols].describe().T
    result = []
    for col, row in desc.iterrows():
        result.append({
            "column": str(col),
            "count": int(row["count"]),
            "mean": round(float(row["mean"]), 2),
            "std": round(float(row["std"]), 2) if pd.notna(row["std"]) else 0.0,
            "min": round(float(row["min"]), 2),
            "q25": round(float(row["25%"]), 2),
            "median": round(float(row["50%"]), 2),
            "q75": round(float(row["75%"]), 2),
            "max": round(float(row["max"]), 2),
            "skew": round(float(df[col].skew()), 2) if len(df) > 2 else 0.0
        })
    return {"columns": result}

def get_correlation_matrix(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if len(numeric_cols) < 2:
        return {"variables": numeric_cols, "matrix": [], "insights": []}
    
    corr = df[numeric_cols].corr()
    matrix = []
    insights = []
    
    for row_col in numeric_cols:
        row_vals = {}
        for col_col in numeric_cols:
            val = corr.loc[row_col, col_col]
            row_vals[col_col] = round(float(val), 3) if pd.notna(val) else None
        matrix.append({"variable": row_col, "correlations": row_vals})

    # Generate strictly neutral correlation insights (never infer causation)
    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            c1 = numeric_cols[i]
            c2 = numeric_cols[j]
            r = corr.loc[c1, c2]
            if pd.notna(r) and abs(r) >= 0.4:
                direction = "positive" if r > 0 else "inverse"
                strength = "strong" if abs(r) >= 0.7 else "moderate"
                insights.append(
                    f"'{c1}' and '{c2}' show a {strength} {direction} correlation of {round(float(r), 2)}."
                )

    return {
        "variables": numeric_cols,
        "matrix": matrix,
        "insights": insights[:5]
    }

def get_outlier_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    outlier_summary = []
    
    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(series) >= 10:
            q25 = series.quantile(0.25)
            q75 = series.quantile(0.75)
            iqr = q75 - q25
            lb = q25 - 1.5 * iqr
            ub = q75 + 1.5 * iqr
            outliers = series[(series < lb) | (series > ub)]
            outlier_summary.append({
                "column": col,
                "q25": round(float(q25), 2),
                "q75": round(float(q75), 2),
                "iqr": round(float(iqr), 2),
                "lower_bound": round(float(lb), 2),
                "upper_bound": round(float(ub), 2),
                "outlier_count": len(outliers),
                "outlier_percentage": round((len(outliers) / len(series) * 100), 2),
                "min_outlier": round(float(outliers.min()), 2) if len(outliers) > 0 else None,
                "max_outlier": round(float(outliers.max()), 2) if len(outliers) > 0 else None,
            })
    return {"columns": outlier_summary}

def get_column_histogram(df: pd.DataFrame, column: str, bins: int = 15) -> Dict[str, Any]:
    if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
        return {"column": column, "bins": []}
    
    valid = pd.to_numeric(df[column], errors="coerce").dropna()
    if len(valid) == 0:
        return {"column": column, "bins": []}
        
    counts, edges = np.histogram(valid, bins=bins)
    bin_data = []
    for i in range(len(counts)):
        bin_label = f"{round(edges[i], 1)} - {round(edges[i+1], 1)}"
        bin_data.append({
            "range": bin_label,
            "min": round(float(edges[i]), 2),
            "max": round(float(edges[i+1]), 2),
            "count": int(counts[i])
        })
    return {"column": column, "bins": bin_data}
