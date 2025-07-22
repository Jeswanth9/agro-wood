from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.dependency import get_db
from app.auth_helper import verify_jwt_token
from pydantic import BaseModel, field_validator, ValidationInfo
from typing import Optional

router = APIRouter()

class OrderCreate(BaseModel):
    product_id: int
    customer_id: int
    quantity: int = 1

    @field_validator("product_id", "customer_id")
    @classmethod
    def id_positive(cls, v: int, info: ValidationInfo) -> int:
        if v is None or v <= 0:
            raise ValueError(f"{info.field_name} must be a positive integer")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int, info: ValidationInfo) -> int:
        if v is None or v <= 0:
            raise ValueError("Quantity must be a positive integer")
        return v

class OrderUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    product_id: int
    customer_id: int
    quantity: int
    total_price: float
    status: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    product: Optional[dict] = None
    customer: Optional[dict] = None
    owner: Optional[dict] = None



def build_order_response(order_row, db: Session) -> OrderResponse:
    order_dict = dict(order_row._mapping)

    if order_dict.get("created_at"):
        order_dict["created_at"] = str(order_dict["created_at"])
    if order_dict.get("updated_at"):
        order_dict["updated_at"] = str(order_dict["updated_at"])
    if not order_dict.get("status"):
        order_dict["status"] = "pending"

    product_details = db.execute(text("SELECT * FROM products WHERE id = :id"),
                                 {"id": order_dict["product_id"]}).fetchone()
    customer_details = db.execute(text("SELECT * FROM users WHERE id = :id"),
                                  {"id": order_dict["customer_id"]}).fetchone()

    order_dict["product"] = dict(product_details._mapping) if product_details else None
    order_dict["customer"] = dict(customer_details._mapping) if customer_details else None

    owner = None
    if product_details and hasattr(product_details, "user_id"):
        owner_details = db.execute(text("SELECT * FROM users WHERE id = :id"),
                                   {"id": product_details.user_id}).fetchone()
        owner = dict(owner_details._mapping) if owner_details else None
    order_dict["owner"] = owner

    return OrderResponse(**order_dict)


@router.post("/orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate = Body(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    product = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": order.product_id}).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if there's enough quantity available
    if product.quantity < order.quantity:
        raise HTTPException(status_code=400, detail="Not enough quantity available")

    customer = db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": order.customer_id}).fetchone()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Calculate remaining quantity and total price
    remaining_quantity = product.quantity - order.quantity
    total_price = float(product.price) * order.quantity

    # Update product quantity
    update_product_query = text("""
        UPDATE products 
        SET quantity = :remaining_quantity 
        WHERE id = :product_id
    """)
    db.execute(update_product_query, {
        "remaining_quantity": remaining_quantity,
        "product_id": order.product_id
    })

    insert_query = text("""
        INSERT INTO orders (product_id, customer_id, quantity, total_price)
        VALUES (:product_id, :customer_id, :quantity, :total_price)
    """)
    result = db.execute(insert_query, {
        "product_id": order.product_id,
        "customer_id": order.customer_id,
        "quantity": order.quantity,
        "total_price": total_price
    })
    db.commit()
    last_id = result.lastrowid
    new_order = db.execute(text("SELECT * FROM orders WHERE id = :id"), {"id": last_id}).fetchone()
    if not new_order:
        raise HTTPException(status_code=500, detail="Order creation failed")

    return build_order_response(new_order, db)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    order = db.execute(text("SELECT * FROM orders WHERE id = :id"), {"id": order_id}).fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return build_order_response(order, db)


@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    update: OrderUpdate = Body(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    order = db.execute(text("SELECT * FROM orders WHERE id = :id"), {"id": order_id}).fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    product = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": order.product_id}).fetchone()
    user_id = token_data.get("user_id")

    if user_id != order.customer_id and user_id != product.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")

    update_fields = []
    params = {"id": order_id}

    if update.status is not None:
        update_fields.append("status = :status")
        update_fields.append("updated_at = NOW()")
        params["status"] = update.status

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    update_query = text(f"UPDATE orders SET {', '.join(update_fields)} WHERE id = :id")
    db.execute(update_query, params)
    db.commit()

    updated_order = db.execute(text("SELECT * FROM orders WHERE id = :id"), {"id": order_id}).fetchone()
    return build_order_response(updated_order, db)

@router.get("/orders/customer/{customer_id}", response_model=list[OrderResponse])
def get_orders_by_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    orders = db.execute(text("SELECT * FROM orders WHERE customer_id = :customer_id"), {"customer_id": customer_id}).fetchall()
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found for this customer")

    return [build_order_response(order, db) for order in orders]

@router.get("/orders/owner/{owner_id}", response_model=list[OrderResponse])
def get_orders_by_owner(
    owner_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    orders = db.execute(text("""
        SELECT o.* FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE p.user_id = :owner_id
    """), {"owner_id": owner_id}).fetchall()
    
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found for this owner")

    return [build_order_response(order, db) for order in orders]
