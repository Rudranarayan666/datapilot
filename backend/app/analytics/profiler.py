from typing import Dict, Any, List
import pandas as pd
import numpy as np

def detect_column_type(series: pd.Series) -> tuple[str, str]:
    """Returns (dtype_name, general_type) where general_type is numeric, categorical, datetime, boolean."""
    dtype_str = str(series.dtype)
    
    if pd.api.types.is_bool_dtype(series):
        return dtype_str, "boolean"
    if pd.api.types.is_numeric_dtype(series):
        # Check if actually boolean 0/1 or tiny integer
        return dtype_str, "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return dtype_str, "datetime"
    
    # Try parsing sample strings as dates
    non_null = series.dropna()
    if len(non_null) > 0 and len(non_null) <= 10000:
        sample = non_null.head(50)
        try:
            parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
            if parsed.notna().sum() / len(sample) > 0.8:
                return "datetime", "datetime"
        except Exception:
            pass
            
    return dtype_str, "categorical"

def profile_dataframe(df: pd.DataFrame, dataset_id: int, dataset_name: str) -> Dict[str, Any]:
    total_rows = len(df)
    total_columns = len(df.columns)
    total_cells = total_rows * total_columns
    missing_cells = int(df.isna().sum().sum())
    missing_cells_pct = round((missing_cells / total_cells * 100), 2) if total_cells > 0 else 0.0
    
    duplicate_rows = int(df.duplicated().sum())
    duplicate_rows_pct = round((duplicate_rows / total_rows * 100), 2) if total_rows > 0 else 0.0
    
    columns_profile = []
    numeric_count = 0
    cat_count = 0
    dt_count = 0

    for col in df.columns:
        series = df[col]
        dtype_name, general_type = detect_column_type(series)
        
        if general_type == "numeric":
            numeric_count += 1
        elif general_type == "datetime":
            dt_count += 1
        else:
            cat_count += 1

        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        
        col_prof: Dict[str, Any] = {
            "name": str(col),
            "dtype": dtype_name,
            "general_type": general_type,
            "total_count": total_rows,
            "unique_count": unique_count,
            "missing_count": missing_count,
            "missing_percentage": missing_pct,
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "std": None,
            "top_value": None,
            "top_value_frequency": None,
            "sample_values": [val if pd.notna(val) else None for val in series.dropna().head(5).tolist()]
        }

        if general_type == "numeric":
            valid = pd.to_numeric(series, errors="coerce").dropna()
            if len(valid) > 0:
                col_prof["min"] = round(float(valid.min()), 2)
                col_prof["max"] = round(float(valid.max()), 2)
                col_prof["mean"] = round(float(valid.mean()), 2)
                col_prof["median"] = round(float(valid.median()), 2)
                col_prof["std"] = round(float(valid.std()), 2) if len(valid) > 1 else 0.0
        elif general_type == "datetime":
            dt_series = pd.to_datetime(series, errors="coerce").dropna()
            if len(dt_series) > 0:
                col_prof["min"] = str(dt_series.min().date())
                col_prof["max"] = str(dt_series.max().date())
        
        # Top value for categorical / boolean
        if len(series.dropna()) > 0:
            val_counts = series.value_counts(dropna=True)
            if len(val_counts) > 0:
                top_v = val_counts.index[0]
                col_prof["top_value"] = str(top_v)
                col_prof["top_value_frequency"] = int(val_counts.iloc[0])

        columns_profile.append(col_prof)

    return {
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "total_rows": total_rows,
        "total_columns": total_columns,
        "total_cells": total_cells,
        "missing_cells": missing_cells,
        "missing_cells_percentage": missing_cells_pct,
        "duplicate_rows": duplicate_rows,
        "duplicate_rows_percentage": duplicate_rows_pct,
        "numeric_columns_count": numeric_count,
        "categorical_columns_count": cat_count,
        "datetime_columns_count": dt_count,
        "columns": columns_profile
    }
