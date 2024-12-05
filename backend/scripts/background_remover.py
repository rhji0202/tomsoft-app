import base64
from rembg import remove
from rembg.session_factory import new_session
from PIL import Image
import io
import sys
import os
import tempfile
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
        logger.info(f"이미지 다운로드 시작: {image_url}")
        # URL 인코딩
        encoded_url = requests.utils.quote(image_url, safe=':/?-._~=&')
        logger.info(f"인코딩된 URL: {encoded_url}")
        
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
            logger.info("이미지 다운로드 요청 시작")
            response = requests.get(encoded_url, headers=headers, verify=verify, stream=True)
            response.raise_for_status()
            
            # 이미지 데이터를 임시 파일에 저장
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
            
            logger.info(f"이미지 다운로드 완료: {temp_file.name}")
            return temp_file.name
            
    except Exception as e:
        logger.error(f"이미지 다운로드 실패: {str(e)}", exc_info=True)
        return None

def remove_background(image_path: str) -> str:
    temp_file = None
    try:
        logger.info(f"배경 제거 시작: {image_path}")
        
        # URL인 경우 다운로드
        if image_path.startswith(('http://', 'https://')):
            logger.info("URL 이미지 감지됨, 다운로드 시도")
            temp_file = download_image(image_path)
            if not temp_file:
                logger.error("이미지 다운로드 실패")
                return None
            image_path = temp_file

        logger.info(f"이미지 파일 열기 시도: {image_path}")
        # 이미지 로드
        input_image = Image.open(image_path)
        logger.info(f"이미지 크기: {input_image.size}, 모드: {input_image.mode}")
        
        # 세션 초기화
        logger.info("rembg 세션 초기화 시작")
        session = new_session('birefnet-general')
        logger.info("rembg 세션 초기화 완료")
        
        # 배경 제거 처리
        logger.info("배경 제거 처리 시작")
        output_image = remove(
            input_image,
            session=session,
            post_process_mask=True,
        )
        logger.info("배경 제거 처리 완료")
        
        # 이미지를 base64로 인코딩
        logger.info("이미지 인코딩 시작")
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        encoded_image = base64.b64encode(img_byte_arr).decode('utf-8')
        logger.info("이미지 인코딩 완료")
        
        return f"data:image/png;base64,{encoded_image}"
        
    except Exception as e:
        logger.error(f"배경 제거 실패: {str(e)}", exc_info=True)  # 스택 트레이스 추가
        return None
        
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
                logger.info(f"임시 파일 삭제 완료: {temp_file}")
            except Exception as e:
                logger.error(f"임시 파일 삭제 실패: {str(e)}")

if __name__ == "__main__":
    logger.info(f"프로그램 시작. 인자: {sys.argv}")
    if len(sys.argv) != 2:
        logger.error("인자가 부족합니다")
        sys.exit(1)
        
    image_path = sys.argv[1]
    logger.info(f"이미지 경로: {image_path}")
    result = remove_background(image_path)
    
    if result:
        logger.info("배경 제거 성공")
        print(result)
        sys.exit(0)
    
    logger.error("배경 제거 실패")
    sys.exit(1) 
