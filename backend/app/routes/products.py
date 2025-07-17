from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.dependency import get_db
from sqlalchemy import text

router = APIRouter()

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM products"))
    return result.fetchall()

@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id})
    product = result.fetchone()
    if not product:
        return {"error": "Product not found"}
    return dict(product)

@router.get("/users/{user_id}/products")
def get_products_by_user(user_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM products WHERE user_id = :user_id"), {"user_id": user_id})
    products = result.fetchall()
    return [dict(row) for row in products]
