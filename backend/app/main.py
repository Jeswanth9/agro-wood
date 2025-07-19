from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import product  
from app.models import user
from app.models import order
from app.routes import products
from app.routes import users
from app.routes import s3

app = FastAPI()

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/iam")
app.include_router(s3.router, prefix="/upload")