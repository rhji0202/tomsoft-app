import base64
from rembg import remove
from rembg.session_factory import new_session
from PIL import Image
import io
import sys
import os
import tempfile
import requests
from urllib.parse import urlparse
from utils.logger import setup_logging
import logging
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import onnxruntime as ort
import platform

def get_cert_path():
    if getattr(sys, 'frozen', False):
        # PyInstaller로 패키징된 경우
        base_path = sys._MEIPASS
    else:
        # 일반 Python 실행의 경우
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend'))
    
    # PEM 파일 경로 반환
    return os.path.join(base_path, 'cert', 'autorunlab.pem')

def setup_logger(process_id: str = None):
    logger = setup_logging('background_remover')
    if process_id:
        # 프로세스 ID를 로거에 추가하는 필터 생성
        class ProcessIdFilter(logging.Filter):
            def filter(self, record):
                record.process_id = process_id
                return True
        
        logger.addFilter(ProcessIdFilter())
        # 로그 포맷 수정
        for handler in logger.handlers:
            formatter = logging.Formatter('%(asctime)s - %(name)s - [ProcessID: %(process_id)s] - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
    return logger

def download_image(image_url: str) -> str:
    try:
        logger.info(f"Image download started: {image_url}")
        # URL 인코딩
        encoded_url = requests.utils.quote(image_url, safe=':/?-._~=&')
        logger.info(f"Encoded URL: {encoded_url}")
        
        # 헤더 설정
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.aliexpress.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
        
        # requests 세션 설정
        session = requests.Session()
        retry_strategy = Retry(
            total=5,
            backoff_factor=1,
            status_forcelist=[500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # SSL 검증 비활성화 (개발 환경에서만 사용)
        session.verify = False
        # 경고 메시지 무시
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # 임시 파일 생성
        suffix = os.path.splitext(urlparse(image_url).path)[1]
        if not suffix:
            suffix = '.png'
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            logger.info("Image download request started")
            response = session.get(
                encoded_url, 
                headers=headers, 
                verify=False,  # SSL 검증 비활성화
                stream=True
            )
            response.raise_for_status()
            
            # 이미지 데이터를 임시 파일에 저장
            for chunk in response.iter_content(chunk_size=8192):
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
        
        # ONNX Runtime 프로바이더 설정
        providers = []
        available_providers = ort.get_available_providers()
        logger.info(f"Available providers: {available_providers}")
        
        # Apple Silicon (M1/M2) 설정
        if sys.platform == 'darwin' and platform.processor() == 'arm':
            # M1/M2에서는 CPU 프로바이더만 사용
            if 'CPUExecutionProvider' in available_providers:
                providers.append('CPUExecutionProvider')
        else:
            if 'CPUExecutionProvider' in available_providers:
                providers.append('CPUExecutionProvider')
        
        logger.info(f"Using ONNX Runtime providers: {providers}")
        
        try:
            # 세션 초기화 시도
            logger.info("Attempting to initialize rembg session")
            session = new_session(model_name, providers=providers)
            logger.info("rembg session initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize rembg session: {str(e)}", exc_info=True)
            # 기본 CPU 프로바이더로 재시도
            logger.info("Retrying with default CPU provider")
            session = new_session(model_name, providers=['CPUExecutionProvider'])
            logger.info("rembg session initialized with default provider")
        
        # 배경 제거 처리
        logger.info("Starting background removal")
        output_image = remove(
            input_image,
            session=session,
            post_process_mask=True,
            bgcolor=(255, 255, 255, 255)
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
    if len(sys.argv) < 2:
        print("Insufficient arguments")
        sys.exit(1)
        
    image_path = sys.argv[1]
    process_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    # 프로세스 ID를 포함한 로거 설정
    logger = setup_logger(process_id)
    
    logger.info(f"Program started. Image path: {image_path}")
    result = remove_background(image_path)
    
    if result:
        logger.info("Background removal successful")
        print(result)
        sys.exit(0)
    
    logger.error("Background removal failed")
    sys.exit(1) 
