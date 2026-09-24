import os
from typing import Dict
import pandas as pd
from app.models.models import Dataset

# In-memory dataframe cache keyed by dataset_id + version
_DF_CACHE: Dict[str, pd.DataFrame] = {}

def get_dataset_dataframe(dataset: Dataset) -> pd.DataFrame:
    cache_key = f"{dataset.id}_v{dataset.version}"
    if cache_key in _DF_CACHE:
        return _DF_CACHE[cache_key]
        
    path = dataset.file_path
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset file at {path} does not exist.")
        
    if path.endswith(".csv"):
        df = pd.read_csv(path)
    elif path.endswith(".xlsx") or path.endswith(".xls"):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
        
    _DF_CACHE[cache_key] = df
    return df

def update_dataset_cache(dataset: Dataset, df: pd.DataFrame):
    cache_key = f"{dataset.id}_v{dataset.version}"
    _DF_CACHE[cache_key] = df
