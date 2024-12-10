# Backend

이 프로젝트는 이미지 배경 제거 기능을 제공하는 백엔드 서비스입니다.

## 요구사항

- Python 3.8 이상
- pip (파이썬 패키지 관리자)

## 설치 방법

1. 가상환경 생성 및 활성화

```bash
# 가상환경 생성
python -m venv venv
# 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

2. 패키지 설치

```bash
pip install -r requirements.txt
```

## 빌드 방법

```bash
pyinstaller -F ./specs/background_remover.win.spec
pyinstaller -F ./specs/background_remover.mac.spec
pyinstaller -F ./specs/background_remover.linux.spec
```

빌드된 실행 파일은 `dist` 디렉토리에 생성됩니다.

## 지원 플랫폼

- Windows
- macOS (Intel/Apple Silicon)
- Linux

## 주의사항

- macOS에서 빌드하기 전에 OpenSSL이 설치되어 있어야 합니다:
  ```bash
  brew install openssl
  ```

- Apple Silicon (M1/M2) Mac의 경우 `onnxruntime-silicon` 패키지를 설치해야 합니다.
- NVIDIA GPU가 있는 시스템의 경우 `onnxruntime-gpu` 패키지를 설치해야 합니다.

## 로그 확인

로그 파일은 다음 위치에 저장됩니다:
- Windows: `%USERPROFILE%\.autorunlab\`
- macOS/Linux: `~/.autorunlab/`