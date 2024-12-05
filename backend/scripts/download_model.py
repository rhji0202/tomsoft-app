import os
import urllib.request
import logging
from utils.logger import setup_logging

logger = setup_logging('model_downloader')

def download_u2net_model():
    model_url = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
    home = os.path.expanduser("~")
    model_path = os.path.join(home, ".u2net")
    model_file = os.path.join(model_path, "u2net.onnx")
    
    if not os.path.exists(model_path):
        os.makedirs(model_path)
    
    if not os.path.exists(model_file):
        logger.info("U2NET 모델 다운로드 시작")
        try:
            urllib.request.urlretrieve(model_url, model_file)
            logger.info("모델 다운로드 완료")
        except Exception as e:
            logger.error(f"모델 다운로드 실패: {str(e)}")
            return False
    else:
        logger.info("모델이 이미 존재합니다")
    
    return True

if __name__ == "__main__":
    download_u2net_model() 