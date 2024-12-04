from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
from app.routes import background

app = FastAPI()
app.include_router(background.router)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FastAPI server is running"}

# 직접 실행을 위한 메인 함수 추가
def main():
    uvicorn.run(app, host="127.0.0.1", port=58000)

if __name__ == "__main__":
    main() 