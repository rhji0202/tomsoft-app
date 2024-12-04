import httpx
import base64
from rembg import remove
from rembg.session_factory import new_session
from fastapi import HTTPException
from PIL import Image
import io

# 세션 초기화
session = new_session("birefnet-general", providers=['CPUExecutionProvider'])

# 최대 이미지 크기 설정
MAX_IMAGE_SIZE = 2000  # 픽셀 단위

def resize_image_if_needed(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    width, height = image.size
    
    # 이미지가 너무 큰 경우 리사이징
    if width > MAX_IMAGE_SIZE or height > MAX_IMAGE_SIZE:
        ratio = min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height)
        new_size = (int(width * ratio), int(height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # 이미지를 바이트로 변환
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=image.format or 'PNG')
        return img_byte_arr.getvalue()
    
    return image_bytes

async def remove_background(image_url: str) -> str:
    try:
        # 이미지 URL에서 다운로드
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="이미지를 다운로드할 수 없습니다")
            
            input_image = resize_image_if_needed(response.content)
            
        # 배경 제거
        output_image = remove(input_image, session=session)
        
        # base64로 인코딩
        encoded_image = base64.b64encode(output_image).decode('utf-8')
        
        return f"data:image/png;base64,{encoded_image}"
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 