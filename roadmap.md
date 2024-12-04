아래는 회원가입 응용프로그램의 PRD(제품 요구사항 문서, Product Requirement Document)입니다.

회원가입 응용프로그램 PRD

1. 개요

1.1. 제품 이름

회원가입 응용프로그램

1.2. 제품 목표

사용자가 계정을 생성하고 로그인할 수 있는 기본적인 회원관리 시스템.
이를 통해 향후 권한 관리, 사용자 정보 업데이트 기능 등을 확장 가능하도록 설계.
windows 10 환경에서 실행되는 응용프로그램.
macOS 환경에서 실행되는 응용프로그램.
android 환경에서 실행되는 응용프로그램.

2. 주요 기능

2.1. 사용자 기능

    •	회원가입
    •	이름, 이메일, 비밀번호를 입력하여 계정 생성.
    •	이메일 중복 여부 확인.
    •	비밀번호 최소 길이 및 강도 검사.
    •	로그인
    •	이메일과 비밀번호를 입력하여 로그인.
    •	잘못된 이메일 또는 비밀번호 입력 시 오류 메시지 표시.
    •	로그아웃
    •	현재 세션 종료.
    •	회원 정보 보기 (추가 기능)
    •	사용자가 자신의 프로필 정보를 확인.
    •	회원 정보 수정 (추가 기능)
    •	이름, 비밀번호 수정 가능.

2.2. 관리자 기능 (확장 가능)

    •	사용자 목록 조회.
    •	사용자 계정 삭제.
    •	권한 관리(예: 일반 사용자, 관리자).

3. 시스템 요구사항

3.1. 프론트엔드

    •	프레임워크: React
    •	라이브러리: Electron, Vite
    •	UI 라이브러리: Material-UI 또는 Tailwind CSS
    •	기능:
    •	API와의 통신을 통해 회원가입 및 로그인 기능 제공.
    •	JWT 토큰을 통한 인증 처리.

3.2. 백엔드

    •	프레임워크: FastAPI
    •	데이터베이스: SQLite (초기), PostgreSQL/MySQL (확장 가능)
    •	기능:
    •	사용자 정보 저장 (이름, 이메일, 해시된 비밀번호).
    •	비밀번호 암호화 저장 (bcrypt 사용).
    •	JWT 기반 인증 구현.

3.3. 배포 환경

    •	프론트엔드: Electron으로 데스크톱 애플리케이션으로 빌드.
    •	백엔드: Uvicorn을 사용하여 서버 실행. Docker로 컨테이너화 가능.

4. 기술 스택

구성 요소 선택 기술 이유
프론트엔드 React, Electron 데스크톱 환경 지원, 빠른 개발 속도.
백엔드 FastAPI 높은 성능과 간결한 코드, Python 생태계 활용.
데이터베이스 SQLite, PostgreSQL SQLite: 초기 개발에 적합. PostgreSQL: 확장 가능.
인증 및 보안 JWT, bcrypt 효율적이고 안전한 인증 처리.

5. 사용자 흐름

5.1. 회원가입

    1.	사용자가 이름, 이메일, 비밀번호 입력.
    2.	입력값 유효성 검증 (프론트엔드 및 백엔드).
    3.	이메일 중복 여부 확인 (백엔드).
    4.	성공 시 데이터베이스에 사용자 정보 저장.
    5.	성공 메시지 반환 및 로그인 화면으로 이동.

5.2. 로그인

    1.	사용자가 이메일과 비밀번호 입력.
    2.	데이터베이스에서 사용자 정보 확인.
    3.	비밀번호 일치 여부 확인 (bcrypt).
    4.	성공 시 JWT 토큰 발급 및 세션 유지.

6. 데이터베이스 설계

6.1. 테이블 구조

users 테이블

필드 이름 데이터 타입 속성 설명
id INTEGER PRIMARY KEY, AUTO INCREMENT 사용자 고유 ID
name TEXT NOT NULL 사용자 이름
email TEXT UNIQUE, NOT NULL 사용자 이메일
password TEXT NOT NULL 해시된 비밀번호
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 계정 생성 시간

7. API 설계

7.1. 회원가입

    •	URL: /signup
    •	Method: POST
    •	Request Body:

{
"name": "John Doe",
"email": "john@example.com",
"password": "password123"
}

    •	Response:
    •	성공:

{
"message": "회원가입 성공!"
}

    •	실패:

{
"detail": "이미 존재하는 이메일입니다."
}

7.2. 로그인

    •	URL: /login
    •	Method: POST
    •	Request Body:

{
"email": "john@example.com",
"password": "password123"
}

    •	Response:
    •	성공:

{
"access_token": "JWT_TOKEN",
"token_type": "bearer"
}

    •	실패:

{
"detail": "이메일 또는 비밀번호가 잘못되었습니다."
}

8. 일정 계획

단계 기간 주요 작업
요구사항 분석 1주 주요 기능 정의, 기술 스택 결정.
프론트엔드 개발 2~3주 React + Electron 환경 구축 및 UI 개발.
백엔드 개발 2~3주 FastAPI로 API 개발 및 데이터베이스 연동.
통합 및 테스트 1주 프론트엔드와 백엔드 연동 테스트.
배포 및 문서화 1주 애플리케이션 빌드 및 사용자 문서 작성.
