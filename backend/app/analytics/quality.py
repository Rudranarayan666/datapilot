from typing import Dict, Any, List
import pandas as pd
import numpy as np
from app.analytics.profiler import detect_column_type

def calculate_quality_score(df: pd.DataFrame, dataset_id: int) -> Dict[str, Any]:
    """
    Computes a 0-100 data quality score based on 4 weighted pillars:
    - Completeness (35%): (1 - missing_cells / total_cells) * 100
    - Uniqueness (25%): (1 - duplicate_rows / total_rows) * 100
    - Validity (20%): Percentage of columns without constant values and consistent types
    - Consistency (20%): IQR potential outlier adherence and formatting
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    total_cells = total_rows * total_cols
    
    if total_rows == 0 or total_cols == 0:
        return {
            "dataset_id": dataset_id,
            "overall_score": 0.0,
            "scores": {"completeness": 0.0, "uniqueness": 0.0, "validity": 0.0, "consistency": 0.0},
            "issues": [],
            "fixable_issues_count": 0
        }

    # 1. Completeness
    missing_cells = int(df.isna().sum().sum())
    completeness_score = max(0.0, min(100.0, (1.0 - (missing_cells / total_cells)) * 100))

    # 2. Uniqueness
    dup_rows = int(df.duplicated().sum())
    uniqueness_score = max(0.0, min(100.0, (1.0 - (dup_rows / total_rows)) * 100))

    # 3. Validity (constant columns check)
    constant_cols = [col for col in df.columns if df[col].nunique(dropna=False) <= 1]
    validity_score = max(0.0, min(100.0, (1.0 - (len(constant_cols) / total_cols)) * 100))

    # 4. Consistency & Outliers
    issues: List[Dict[str, Any]] = []

    # Detect duplicate rows issue
    if dup_rows > 0:
        issues.append({
            "issue_type": "duplicate_rows",
            "severity": "medium" if (dup_rows / total_rows) < 0.05 else "high",
            "column": None,
            "affected_rows": dup_rows,
            "affected_percentage": round((dup_rows / total_rows * 100), 2),
            "sample_values": [],
            "suggested_fix": f"Remove {dup_rows} identical duplicate rows to ensure entity integrity.",
            "fix_action": "drop_duplicates"
        })

    # Detect missing values per column
    for col in df.columns:
        m_count = int(df[col].isna().sum())
        if m_count > 0:
            m_pct = round((m_count / total_rows * 100), 2)
            _, gen_type = detect_column_type(df[col])
            fix_action = "impute_numeric_mean" if gen_type == "numeric" else "impute_categorical_mode"
            fix_text = "Impute missing numeric values with column mean" if gen_type == "numeric" else "Fill missing categorical values with mode"
            
            issues.append({
                "issue_type": "missing_values",
                "severity": "high" if m_pct > 20 else ("medium" if m_pct > 5 else "low"),
                "column": str(col),
                "affected_rows": m_count,
                "affected_percentage": m_pct,
                "sample_values": [val for val in df[col].dropna().head(3).tolist()],
                "suggested_fix": fix_text,
                "fix_action": f"{fix_action}:{col}"
            })

    # Detect constant columns
    for col in constant_cols:
        issues.append({
            "issue_type": "constant_column",
            "severity": "low",
            "column": str(col),
            "affected_rows": total_rows,
            "affected_percentage": 100.0,
            "sample_values": [str(df[col].iloc[0])] if total_rows > 0 else [],
            "suggested_fix": f"Column '{col}' carries no variance (single unique value). Consider dropping.",
            "fix_action": f"drop_column:{col}"
        })

    # Detect potential outliers via IQR (Interquartile Range)
    outlier_cells_total = 0
    numeric_cols_evaluated = 0
    for col in df.columns:
        _, gen_type = detect_column_type(df[col])
        if gen_type == "numeric":
            numeric_cols_evaluated += 1
            num_series = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(num_series) >= 20:
                q25 = num_series.quantile(0.25)
                q75 = num_series.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr
                    outliers = num_series[(num_series < lower_bound) | (num_series > upper_bound)]
                    outlier_count = len(outliers)
                    if outlier_count > 0:
                        outlier_cells_total += outlier_count
                        pct = round((outlier_count / len(num_series) * 100), 2)
                        issues.append({
                            "issue_type": "potential_outliers",
                            "severity": "low" if pct < 3 else "medium",
                            "column": str(col),
                            "affected_rows": outlier_count,
                            "affected_percentage": pct,
                            "sample_values": [round(float(v), 2) for v in outliers.head(4).tolist()],
                            "suggested_fix": f"Identified {outlier_count} potential statistical outliers outside [{round(lower_bound, 2)}, {round(upper_bound, 2)}]. Note: Validate if legitimate business events.",
                            "fix_action": f"cap_outliers_iqr:{col}"
                        })

    outlier_ratio = (outlier_cells_total / (total_rows * max(1, numeric_cols_evaluated))) if numeric_cols_evaluated > 0 else 0
    consistency_score = max(0.0, min(100.0, (1.0 - outlier_ratio) * 100))

    # Overall score = 0.35 * completeness + 0.25 * uniqueness + 0.20 * validity + 0.20 * consistency
    overall_score = round(
        0.35 * completeness_score +
        0.25 * uniqueness_score +
        0.20 * validity_score +
        0.20 * consistency_score,
        1
    )

    return {
        "dataset_id": dataset_id,
        "overall_score": overall_score,
        "scores": {
            "completeness": round(completeness_score, 1),
            "uniqueness": round(uniqueness_score, 1),
            "validity": round(validity_score, 1),
            "consistency": round(consistency_score, 1)
        },
        "issues": issues,
        "fixable_issues_count": len([i for i in issues if i["fix_action"] != "none"])
    }

def apply_cleaning_actions(df: pd.DataFrame, actions: List[str]) -> pd.DataFrame:
    """Creates a new clean dataframe copy without mutating the original."""
    cleaned = df.copy()
    
    for action in actions:
        if action == "drop_duplicates":
            cleaned = cleaned.drop_duplicates()
        elif action.startswith("drop_column:"):
            col = action.split(":", 1)[1]
            if col in cleaned.columns:
                cleaned = cleaned.drop(columns=[col])
        elif action.startswith("impute_numeric_mean:"):
            col = action.split(":", 1)[1]
            if col in cleaned.columns:
                mean_val = pd.to_numeric(cleaned[col], errors="coerce").mean()
                if pd.notna(mean_val):
                    cleaned[col] = cleaned[col].fillna(round(mean_val, 2))
        elif action.startswith("impute_categorical_mode:"):
            col = action.split(":", 1)[1]
            if col in cleaned.columns:
                mode_vals = cleaned[col].dropna().mode()
                if len(mode_vals) > 0:
                    cleaned[col] = cleaned[col].fillna(mode_vals[0])
        elif action.startswith("cap_outliers_iqr:"):
            col = action.split(":", 1)[1]
            if col in cleaned.columns:
                num_series = pd.to_numeric(cleaned[col], errors="coerce")
                q25 = num_series.quantile(0.25)
                q75 = num_series.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    lb = q25 - 1.5 * iqr
                    ub = q75 + 1.5 * iqr
                    cleaned[col] = num_series.clip(lower=lb, upper=ub)
                    
    return cleaned
