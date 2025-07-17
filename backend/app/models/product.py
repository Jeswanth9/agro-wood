from sqlalchemy import Column, Integer, String, Text, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2))
    quantity = Column(Integer)
    image_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
