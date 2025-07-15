from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.dependency import get_db
from sqlalchemy import text

router = APIRouter()

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM products"))
    return result.fetchall()
