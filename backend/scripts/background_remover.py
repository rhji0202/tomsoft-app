import base64
from rembg import remove
from rembg.session_factory import new_session
from PIL import Image
import io
import sys
import os
import tempfile
import httpx
import requests
import certifi
from urllib.parse import urlparse
from utils.logger import setup_logging

# SSL 인증서 설정
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

# 로거 초기화
logger = setup_logging('background_remover')

def download_image(image_url: str) -> str:
    try:
        logger.info(f"Image download started: {image_url}")
        # URL 인코딩
        encoded_url = requests.utils.quote(image_url, safe=':/?-._~=&')
        logger.info(f"Encoded URL: {encoded_url}")
        
        # 헤더 추가
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.aliexpress.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
        
        # 인증서 경로 직접 지정
        verify = certifi.where()
        
        # 임시 파일 생성
        suffix = os.path.splitext(urlparse(image_url).path)[1]
        if not suffix:
            suffix = '.png'
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            logger.info("Image download request started")
            # httpx 클라이언트 생성 및 요청
            with httpx.Client(verify=verify) as client:
                with client.stream('GET', encoded_url, headers=headers) as response:
                    response.raise_for_status()
                    # 이미지 데이터를 임시 파일에 저장
                    for chunk in response.iter_bytes(chunk_size=8192):
                        if chunk:
                            temp_file.write(chunk)
            
            logger.info(f"Image download completed: {temp_file.name}")
            return temp_file.name
            
    except Exception as e:
        logger.error(f"Image download failed: {str(e)}", exc_info=True)
        return None

def remove_background(image_path: str) -> str:
    temp_file = None
    try:
        logger.info(f"Background removal started: {image_path}")
        
        # URL인 경우 다운로드
        if image_path.startswith(('http://', 'https://')):
            logger.info("URL image detected, attempting download")
            temp_file = download_image(image_path)
            if not temp_file:
                logger.error("Image download failed")
                return None
            image_path = temp_file

        # 환경 변수에서 모델 이름 가져오기
        model_name = os.getenv('MODEL_NAME', 'birefnet-general')
        
        logger.info(f"Attempting to open image file: {image_path}")
        input_image = Image.open(image_path)
        logger.info(f"Image size: {input_image.size}, mode: {input_image.mode}")
        
        # 세션 초기화
        logger.info("Initializing rembg session")
        session = new_session(model_name)
        logger.info("rembg session initialized")
        
        # 배경 제거 처리
        logger.info("Starting background removal")
        output_image = remove(
            input_image,
            session=session,
            post_process_mask=True,
        )
        logger.info("Background removal completed")
        
        # 이미지를 base64로 인코딩
        logger.info("Encoding image")
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        encoded_image = base64.b64encode(img_byte_arr).decode('utf-8')
        logger.info("Image encoding completed")
        
        return f"data:image/png;base64,{encoded_image}"
        
    except Exception as e:
        logger.error(f"Background removal failed: {str(e)}", exc_info=True)  # 스택 트레이스 추가
        return None
        
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
                logger.info(f"Temporary file deleted: {temp_file}")
            except Exception as e:
                logger.error(f"Failed to delete temporary file: {str(e)}")

if __name__ == "__main__":
    logger.info(f"Program started. Arguments: {sys.argv}")
    if len(sys.argv) != 2:
        logger.error("Insufficient arguments")
        sys.exit(1)
        
    image_path = sys.argv[1]
    logger.info(f"Image path: {image_path}")
    result = remove_background(image_path)
    
    if result:
        logger.info("Background removal successful")
        print(result)
        sys.exit(0)
    
    logger.error("Background removal failed")
    sys.exit(1) 
