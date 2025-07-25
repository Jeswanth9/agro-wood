from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.models import product  
from app.models import user
from app.models import order
from app.routes import products
from app.routes import users
from app.routes import s3
from app.routes import orders

app = FastAPI()
# this is imp to allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://13.222.35.110:3000",
        "http://13.222.35.110:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/iam")
app.include_router(s3.router, prefix="/api")
app.include_router(orders.router, prefix="/api")