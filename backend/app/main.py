from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import product  
from app.models import user
from app.routes import products

app = FastAPI()

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(products.router, prefix="/api")