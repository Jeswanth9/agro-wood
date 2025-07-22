from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.dependency import get_db
from sqlalchemy import text
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator, ValidationInfo
from fastapi import Body

router = APIRouter()

SECRET_KEY = "agrowood"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    @field_validator("username", "password", "email")
    @classmethod
    def not_empty(cls, v: str, info: ValidationInfo) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} must not be empty")
        return v


@router.post("/signup")
def signup(user: UserCreate = Body(...), db: Session = Depends(get_db)):
    username = user.username
    password = user.password
    email = user.email

    result_username = db.execute(text("SELECT * FROM users WHERE username = :username"), {"username": username})
    if result_username.fetchone():
        raise HTTPException(status_code=400, detail="this user name already exists")
    result_email = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email})
    if result_email.fetchone():
        raise HTTPException(status_code=400, detail="this email already exists")
    hashed_password = get_password_hash(password)
    db.execute(
        text("INSERT INTO users (username, hashed_password, email) VALUES (:username, :hashed_password, :email)"),
        {"username": username, "hashed_password": hashed_password, "email": email}
    )
    db.commit()
    user_row = db.execute(text("SELECT * FROM users WHERE username = :username"), {"username": username}).fetchone()
    access_token = create_access_token(data={"sub": username, "user_id": user_row.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_row.id}

class UserLogin(BaseModel):
    username: str
    password: str
    @field_validator("username", "password")
    @classmethod
    def not_empty(cls, v: str, info: ValidationInfo) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} must not be empty")
        return v

@router.post("/login")
def login(user: UserLogin = Body(...), db: Session = Depends(get_db)):
    username = user.username
    password = user.password
    result = db.execute(text("SELECT * FROM users WHERE username = :username"), {"username": username})
    user_row = result.fetchone()
    if not user_row or not verify_password(password, user_row.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": username, "user_id": user_row.id})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_row.id}
