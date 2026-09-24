from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.models import User
from app.schemas.schemas import UserSignup, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    hashed = get_password_hash(data.password)
    user = User(
        name=data.name,
        email=data.email.lower(),
        hashed_password=hashed,
        is_demo=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "is_demo": False}
    }

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "is_demo": user.is_demo}
    }

@router.post("/demo", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    # Find or create demo user
    demo_user = db.query(User).filter(User.email == "demo@insightcanvas.ai").first()
    if not demo_user:
        demo_user = User(
            name="Demo Analyst",
            email="demo@insightcanvas.ai",
            hashed_password=get_password_hash("demo_password_12345"),
            is_demo=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
    token = create_access_token({"sub": str(demo_user.id), "email": demo_user.email, "name": demo_user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": demo_user.id, "name": demo_user.name, "email": demo_user.email, "is_demo": True}
    }
