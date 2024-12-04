const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function buildBackend() {
  const backendPath = path.join(__dirname, "../../backend");
  const venvPath = path.join(backendPath, "venv");

  console.log("Creating Python virtual environment...");
  try {
    // 기존 venv 폴더가 있다면 삭제
    if (fs.existsSync(venvPath)) {
      if (process.platform === "win32") {
        execSync(`rmdir /s /q "${venvPath}"`, { cwd: backendPath });
      } else {
        execSync(`rm -rf "${venvPath}"`, { cwd: backendPath });
      }
    }

    execSync("python3 -m venv venv", { cwd: backendPath });

    console.log("Installing backend dependencies...");
    const pipCommand =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "pip")
        : path.join(venvPath, "bin", "pip");

    // pip 업그레이드
    execSync(`"${pipCommand}" install --upgrade pip`, { cwd: backendPath });
    // 의존성 설치
    execSync(`"${pipCommand}" install -r requirements.txt`, {
      cwd: backendPath,
    });

    // .env 파일 생성
    const envContent = `
SECRET_KEY=your-production-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./sql_app.db
`;

    fs.writeFileSync(path.join(backendPath, ".env"), envContent.trim());

    console.log("Backend build completed!");
  } catch (error) {
    console.error("Backend build failed:", error);
    process.exit(1);
  }
}

buildBackend();
