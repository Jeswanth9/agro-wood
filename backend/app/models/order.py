from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime, String
from sqlalchemy.sql import func
from app.db.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_id = Column(Integer, ForeignKey("users.id"))
    quantity = Column(Integer, default=1)
    total_price = Column(Float)
    status = Column(String(100), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
