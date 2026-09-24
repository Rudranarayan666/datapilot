import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Dataset
from app.schemas.schemas import DatasetSummary, DatasetProfileResponse, DatasetQualityResponse, CleanFixRequest
from app.services.data_service import get_dataset_dataframe, update_dataset_cache
from app.analytics.profiler import profile_dataframe
from app.analytics.quality import calculate_quality_score, apply_cleaning_actions

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetSummary])
def list_datasets(db: Session = Depends(get_db)):
    # Ensure sample datasets exist in DB
    ensure_samples_loaded(db)
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return datasets

@router.post("/upload", response_model=DatasetSummary)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel (.xlsx, .xls) files.")
        
    save_path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(save_path)
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
        
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(save_path)
        else:
            df = pd.read_excel(save_path)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if len(df) == 0:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail="The uploaded dataset contains zero rows.")

    dataset = Dataset(
        name=filename.rsplit(".", 1)[0].replace("_", " ").title(),
        filename=filename,
        file_path=save_path,
        file_size_bytes=file_size,
        row_count=len(df),
        column_count=len(df.columns),
        version=1,
        is_sample=False
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    update_dataset_cache(dataset, df)
    return dataset

@router.get("/{id}/profile", response_model=DatasetProfileResponse)
def get_profile(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if dataset.profile_cache:
        return dataset.profile_cache
        
    df = get_dataset_dataframe(dataset)
    profile = profile_dataframe(df, dataset.id, dataset.name)
    
    dataset.profile_cache = profile
    db.commit()
    return profile

@router.get("/{id}/quality", response_model=DatasetQualityResponse)
def get_quality(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if dataset.quality_cache:
        return dataset.quality_cache
        
    df = get_dataset_dataframe(dataset)
    quality = calculate_quality_score(df, dataset.id)
    
    dataset.quality_cache = quality
    db.commit()
    return quality

@router.post("/{id}/clean", response_model=DatasetSummary)
def clean_dataset(id: int, req: CleanFixRequest, db: Session = Depends(get_db)):
    original = db.query(Dataset).filter(Dataset.id == id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = get_dataset_dataframe(original)
    cleaned_df = apply_cleaning_actions(df, req.actions)
    
    # Save as new versioned dataset
    new_version = original.version + 1
    new_filename = f"{original.filename.rsplit('.', 1)[0]}_v{new_version}.csv"
    new_path = os.path.join(settings.UPLOAD_DIR, new_filename)
    cleaned_df.to_csv(new_path, index=False)
    
    new_dataset = Dataset(
        user_id=original.user_id,
        name=f"{original.name} (Cleaned v{new_version})",
        filename=new_filename,
        file_path=new_path,
        file_size_bytes=os.path.getsize(new_path),
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns),
        version=new_version,
        parent_id=original.id,
        is_sample=False
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)
    
    update_dataset_cache(new_dataset, cleaned_df)
    return new_dataset

def ensure_samples_loaded(db: Session):
    samples = [
        {"name": "Superstore Sales", "filename": "superstore_sales.csv"},
        {"name": "Customer Churn", "filename": "customer_churn.csv"},
        {"name": "Marketing Campaign", "filename": "marketing_campaign.csv"}
    ]
    for s in samples:
        exists = db.query(Dataset).filter(Dataset.filename == s["filename"], Dataset.is_sample == True).first()
        if not exists:
            sample_path = os.path.join(settings.SAMPLES_DIR, s["filename"])
            if os.path.exists(sample_path):
                df = pd.read_csv(sample_path)
                ds = Dataset(
                    name=s["name"],
                    filename=s["filename"],
                    file_path=sample_path,
                    file_size_bytes=os.path.getsize(sample_path),
                    row_count=len(df),
                    column_count=len(df.columns),
                    version=1,
                    is_sample=True
                )
                db.add(ds)
                db.commit()
