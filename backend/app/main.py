from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from .routes import auth
# from .database import engine
# from . import models

# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="회원가입 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(auth.router, prefix="/api/auth", tags=["인증"])

@app.get("/")
def read_root():
    return {"message": "회원가입 API에 오신 것을 환영합니다!"} 