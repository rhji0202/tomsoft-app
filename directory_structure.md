signup-app/
├── frontend/ # 프론트엔드 (React + Electron)
│ ├── public/ # 정적 파일
│ ├── src/
│ │ ├── assets/ # 이미지, 폰트 등
│ │ ├── components/ # 재사용 가능한 컴포넌트
│ │ │ ├── auth/ # 인증 관련 컴포넌트
│ │ │ │ ├── SignUp.tsx
│ │ │ │ ├── Login.tsx
│ │ │ │ └── Logout.tsx
│ │ │ └── common/ # 공통 컴포넌트
│ │ ├── pages/ # 페이지 컴포넌트
│ │ ├── services/ # API 통신 서비스
│ │ ├── store/ # 상태 관리
│ │ ├── utils/ # 유틸리티 함수
│ │ ├── App.tsx
│ │ └── main.tsx
│ ├── electron/ # Electron 관련 설정
│ ├── package.json
│ └── vite.config.ts
│
├── backend/ # 백엔드 (FastAPI)
│ ├── app/
│ │ ├── api/ # API 라우터
│ │ │ ├── auth.py # 인증 관련 API
│ │ │ └── users.py # 사용자 관련 API
│ │ ├── core/ # 핵심 설정
│ │ │ ├── config.py # 환경 설정
│ │ │ └── security.py # 보안 관련 유틸리티
│ │ ├── db/ # 데이터베이스
│ │ │ ├── models.py # DB 모델
│ │ │ └── session.py # DB 세션
│ │ ├── schemas/ # Pydantic 스키마
│ │ └── main.py # FastAPI 앱 진입점
│ ├── tests/ # 테스트 코드
│ ├── requirements.txt # Python 패키지 의존성
│ └── .env # 환경 변수
│
├── docs/ # 문서
│ ├── api/ # API 문서
│ └── setup/ # 설치 가이드
│
└── README.md # 프로젝트 설명
