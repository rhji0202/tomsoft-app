from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
import uvicorn
from app.routes import background
import httpx
from pathlib import Path

app = FastAPI()
app.include_router(background.router)

# CORS 설정
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

@app.get("/")
async def root():
    return {"message": "FastAPI server is running"}

MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx"
MODEL_PATH = Path("models/BiRefNet-general-epoch_244.onnx")

@app.get("/download-model")
async def download_model():
    async def model_download_stream():
        async with httpx.AsyncClient() as client:
            async with client.stream('GET', MODEL_URL) as response:
                total = int(response.headers['Content-Length'])
                async for chunk in response.aiter_bytes():
                    yield chunk

    if not MODEL_PATH.parent.exists():
        MODEL_PATH.parent.mkdir(parents=True)

    headers = {
        'Content-Disposition': 'attachment; filename=BiRefNet-general-epoch_244.onnx',
        'Content-Type': 'application/octet-stream'
    }

    return StreamingResponse(
        model_download_stream(),
        headers=headers
    )

# 직접 실행을 위한 메인 함수 추가
def main():
    uvicorn.run(app, host="127.0.0.1", port=58000)

if __name__ == "__main__":
    main() 