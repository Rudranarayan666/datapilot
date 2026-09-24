from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Dataset
from app.schemas.schemas import AggregationQuery
from app.services.data_service import get_dataset_dataframe
from app.analytics.statistics import get_descriptive_statistics, get_correlation_matrix, get_outlier_analysis, get_column_histogram
from app.analytics.aggregations import run_aggregation
from app.analytics.insights import generate_computed_insights

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{id}/statistics")
def get_stats(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return get_descriptive_statistics(df)

@router.get("/{id}/correlation")
def get_corr(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return get_correlation_matrix(df)

@router.get("/{id}/outliers")
def get_outliers(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return get_outlier_analysis(df)

@router.get("/{id}/histogram")
def get_histogram(id: int, column: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return get_column_histogram(df, column)

@router.get("/{id}/insights")
def get_insights(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return {"insights": generate_computed_insights(df)}

@router.post("/query")
def execute_query(query: AggregationQuery, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == query.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataset_dataframe(dataset)
    return run_aggregation(
        df=df,
        dimension=query.dimension,
        metric=query.metric,
        aggregation=query.aggregation,
        filters=query.filters,
        limit=query.limit,
        sort_order=query.sort_order
    )
