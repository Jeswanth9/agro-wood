from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.db.dependency import get_db
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel, field_validator, ValidationInfo
from app.auth_helper import verify_jwt_token
from fastapi import UploadFile, File, Form
from typing import Optional
from app.routes.s3 import upload_file_to_s3
from pydantic import BaseModel
from typing import Optional
from app.routes.s3 import generate_signed_url
from fastapi import HTTPException

# using this modl to define response
class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    unit: Optional[str] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    image_signed_url: Optional[str] = None
    user_id: int

        

router = APIRouter()

# this route is used to get all products
@router.get("/products", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    result = db.execute(text("SELECT * FROM products"))
    products = []
    for row in result.fetchall():
        data = dict(row._mapping)
        image_url = data.get("image_url")
        signed_url = generate_signed_url(image_url) if image_url else None
        product = ProductResponse(
            **data,
            image_signed_url=signed_url
        )
        products.append(product)
    return products

# this route is used to get a product by id
@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    result = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id})
    product = result.fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = dict(product._mapping)
    image_url = data.get("image_url")
    signed_url = generate_signed_url(image_url) if image_url else None
    return ProductResponse(
        **data,
        image_signed_url=signed_url
    )

# this route is used to get products by user id
@router.get("/owner/{user_id}/products", response_model=list[ProductResponse])
def get_products_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    result = db.execute(text("SELECT * FROM products WHERE user_id = :user_id"), {"user_id": user_id})
    products = []
    for row in result.fetchall():
        data = dict(row._mapping)
        image_url = data.get("image_url")
        signed_url = generate_signed_url(image_url) if image_url else None
        product = ProductResponse(
            **data,
            image_signed_url=signed_url
        )
        products.append(product)
    return products

# this model also validates inputs
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    user_id: int

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str, info: ValidationInfo) -> str:
        if not v or not v.strip():
            raise ValueError("Product name must not be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float, info: ValidationInfo) -> float:
        if v is None or v < 0:
            raise ValueError("Price must be a positive number")
        return v

    @field_validator("user_id")
    @classmethod
    def user_id_positive(cls, v: int, info: ValidationInfo) -> int:
        if v is None or v <= 0:
            raise ValueError("user_id must be a positive integer")
        return v


# this route is used to create a product
@router.post("/products")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    unit: str = Form(...),
    user_id: int = Form(...),
    description: Optional[str] = Form(None),
    quantity: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Product name must not be empty")
    if price is None or price < 0:
        raise HTTPException(status_code=400, detail="Price must be a positive number")
    if not unit or not unit.strip():
        raise HTTPException(status_code=400, detail="Unit must not be empty")
    if user_id is None or user_id <= 0:
        raise HTTPException(status_code=400, detail="user_id must be a positive integer")

    user_check = db.execute(text("SELECT id FROM users WHERE id = :user_id"), {"user_id": user_id}).fetchone()
    if not user_check:
        raise HTTPException(status_code=404, detail="User not found")

    image_url = None
    upload_result = None
    if image:
        try:
            upload_result = await upload_file_to_s3(file=image, token_data=token_data)
            image_url = upload_result.get("file_key")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    try:
        insert_query = text("""
            INSERT INTO products (name, description, price, unit, quantity, image_url, user_id)
            VALUES (:name, :description, :price, :unit, :quantity, :image_url, :user_id)
        """)
        result = db.execute(insert_query, {
            "name": name,
            "description": description,
            "price": price,
            "unit": unit,
            "quantity": quantity,
            "image_url": image_url,
            "user_id": user_id
        })
        db.commit()
        last_id = result.lastrowid
        new_product_result = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": last_id})
        new_product = new_product_result.fetchone()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if new_product:
        product_dict = dict(new_product._mapping)
        image_signed_url = None
        if image and upload_result:
            image_signed_url = upload_result.get("signed_url")
        response = ProductResponse(
            **product_dict,
            image_signed_url=image_signed_url
        )
        return response
    raise HTTPException(status_code=500, detail="Product creation failed")

# this route is used to update a product
@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    unit: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    quantity: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    product = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id}).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    image_url = product.image_url
    if image:
        try:
            upload_result = await upload_file_to_s3(file=image, token_data=token_data)
            image_url = upload_result.get("file_key")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    update_fields = []
    params = {"id": product_id}
    if name is not None:
        update_fields.append("name = :name")
        params["name"] = name
    if description is not None:
        update_fields.append("description = :description")
        params["description"] = description
    if price is not None:
        update_fields.append("price = :price")
        params["price"] = price
    if unit is not None:
        update_fields.append("unit = :unit")
        params["unit"] = unit
    if quantity is not None:
        update_fields.append("quantity = :quantity")
        params["quantity"] = quantity
    if image_url is not None:
        update_fields.append("image_url = :image_url")
        params["image_url"] = image_url
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update_query = text(f"UPDATE products SET {', '.join(update_fields)} WHERE id = :id")
    db.execute(update_query, params)
    db.commit()

    updated_product_result = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id})
    updated_product = updated_product_result.fetchone()
    
    if updated_product:
        product_dict = dict(updated_product._mapping)
        image_signed_url = None
        if image and upload_result:
            image_signed_url = upload_result.get("signed_url")
        return ProductResponse(
            **product_dict,
            image_signed_url=image_signed_url
        )
    
    raise HTTPException(status_code=500, detail="Product update failed")


