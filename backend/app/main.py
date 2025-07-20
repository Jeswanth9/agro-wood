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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sturdy-spoon-wrgwv5pvj9qjf57xw-5174.app.github.dev"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/iam")
app.include_router(s3.router, prefix="/api")
app.include_router(orders.router, prefix="/api")