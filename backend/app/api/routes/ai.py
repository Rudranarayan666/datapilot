from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Dataset
from app.schemas.schemas import AnalysisPlanResponse, AskDataRequest, AskDataResponse
from app.services.data_service import get_dataset_dataframe
from app.analytics.dashboard_planner import generate_dashboard_plan
from app.analytics.ask_engine import ask_your_data
from app.ai.client import call_llm_structured

router = APIRouter(prefix="/ai", tags=["AI & Planning"])

@router.post("/plan", response_model=AnalysisPlanResponse)
def plan_analysis(dataset_id: int, question: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = get_dataset_dataframe(dataset)
    plan_dict = generate_dashboard_plan(df, question)
    plan_dict["dataset_id"] = dataset.id
    return plan_dict

@router.post("/ask", response_model=AskDataResponse)
def ask_data(req: AskDataRequest, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = get_dataset_dataframe(dataset)
    result = ask_your_data(df, req.question)
    
    # Optional constrained LLM explanation (only passes calculated summary, never raw data)
    prompt = f"User asked: '{req.question}'. Engine computed answer: '{result['answer_text']}'. Calculation details: {result['calculation_basis']}. Provide a 1-sentence data analyst takeaway."
    system_prompt = "You are a senior BI analyst. Be concise, direct, professional. Never invent numbers."
    llm_exp = call_llm_structured(prompt, system_prompt)
    if llm_exp:
        result["ai_explanation"] = llm_exp.strip()
        
    return result
