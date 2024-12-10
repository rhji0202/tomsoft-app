import os
import logging
from datetime import datetime

def setup_logging(logger_name: str):
    """
    로깅 설정을 초기화하고 logger 인스턴스를 반환합니다.
    
    Args:
        logger_name (str): 로거 이름
        
    Returns:
        logging.Logger: 설정된 로거 인스턴스
    """
    # .theonemind 폴더 생성
    log_dir = os.path.expanduser('~/.autorunlab')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 로그 파일 경로 설정
    log_file = os.path.join(log_dir, f'{logger_name}_{datetime.now().strftime("%Y%m%d")}.log')
    
    # 로거 설정
    logger = logging.getLogger(logger_name)
    
    if not logger.handlers:  # 핸들러가 없을 때만 추가
        logger.setLevel(logging.INFO)
        
        # 파일 핸들러
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        
        # 콘솔 핸들러
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger 