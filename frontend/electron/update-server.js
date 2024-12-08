const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:51733", "app://.", "file://"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "User-Agent"],
    credentials: true,
  })
);

// 개발 환경을 위한 설정 추가
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // 요청 로깅
  next();
});

// yml 파일 서비스를 위한 라우트 수정
app.get("/latest-mac.yml", (req, res) => {
  const ymlPath = path.join(__dirname, "../release/latest-mac.yml");
  console.log("yml 파일 요청:", ymlPath);
  console.log("yml 파일 존재 여부:", fs.existsSync(ymlPath));

  if (fs.existsSync(ymlPath)) {
    try {
      const content = fs.readFileSync(ymlPath, "utf8");
      console.log("yml 파일 내용:", content);
      res.sendFile(ymlPath);
    } catch (err) {
      console.error("yml 파일 읽기 실패:", err);
      res.status(500).send("Error reading yml file");
    }
  } else {
    res.status(404).send("Update file not found");
  }
});

// 에러 핸들링 추가
app.use((err, req, res, next) => {
  console.error("서버 에러:", err);
  res.status(500).json({
    error: "업데이트 서버 오류",
    details: err.message,
  });
});

// 업데이트 정보를 제공하는 엔드포인트
app.get("/update/:platform/:version", (req, res) => {
  const { platform, version } = req.params;

  // package.json에서 현재 버전 정보 읽기
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"))
  );
  const latestVersion = packageJson.version;

  // 버전 비교 로직 추가
  const currentVersion = version.replace(/^v/, "");
  if (currentVersion >= latestVersion) {
    console.log("현재 버전이 최신 버전보다 같거나 높음:", {
      current: currentVersion,
      latest: latestVersion,
    });
    res.status(204).send();
    return;
  }

  console.log("업데이트 필요:", {
    current: currentVersion,
    latest: latestVersion,
  });

  const serverUrl = process.env.UPDATE_SERVER_URL || "http://localhost:80";

  // 플랫폼별 응답 구성
  const updateInfo = {
    version: latestVersion,
    files: [
      {
        url:
          platform === "darwin"
            ? `${serverUrl}/TheOneMindUtility-${latestVersion}-arm64.dmg`
            : `${serverUrl}/TheOneMindUtility-${latestVersion}-setup.exe`,
        sha512:
          platform === "darwin"
            ? "c36bdf110d2122b6e742d5f684eb2b1ef64aeefe9d6699981c072daa1af5ad70aece8f6d66b3c86a5af4ea4ec3c5850f6e78fb8f5755e3ae21f3fb84f3a69dbf"
            : "sha512-windows-hash",
        size: platform === "darwin" ? 236639959 : 0,
      },
    ],
    path:
      platform === "darwin"
        ? `TheOneMindUtility-${latestVersion}-arm64.dmg`
        : `TheOneMindUtility-${latestVersion}-setup.exe`,
    sha512:
      platform === "darwin"
        ? "c36bdf110d2122b6e742d5f684eb2b1ef64aeefe9d6699981c072daa1af5ad70aece8f6d66b3c86a5af4ea4ec3c5850f6e78fb8f5755e3ae21f3fb84f3a69dbf"
        : "sha512-windows-hash",
    releaseDate: new Date().toISOString(),
  };

  if (platform === "darwin" || platform === "win32") {
    res.json(updateInfo);
  } else {
    res.status(400).json({ error: "지원하지 않는 플랫폼입니다." });
  }
});

// 업데이트 파일 제공을 위한 정적 파일 서버 수정
app.get("/:file", (req, res) => {
  const filePath = path.join(__dirname, "../release", req.params.file);
  console.log("요청된 파일 경로:", filePath);
  console.log("파일 존재 여부:", fs.existsSync(filePath));

  // 파일 상세 정보 로깅
  try {
    const stats = fs.statSync(filePath);
    console.log("파일 정보:", {
      size: stats.size,
      permissions: stats.mode,
      created: stats.birthtime,
      modified: stats.mtime,
    });
  } catch (err) {
    console.error("파일 정보 읽기 실패:", err);
  }

  if (fs.existsSync(filePath)) {
    console.log("파일 전송 시작:", filePath);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("파일 전송 실패:", err);
        res.status(500).send("Error sending file");
      } else {
        console.log("파일 전송 완료");
      }
    });
  } else {
    console.log("파일 없음:", filePath);
    // 디렉토리 내용 확인
    try {
      const releaseDir = path.join(__dirname, "../release");
      const files = fs.readdirSync(releaseDir);
      console.log("release 디렉토리 내용:", files);
    } catch (err) {
      console.error("디렉토리 읽기 실패:", err);
    }
    res.status(404).send("Update file not found");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

// 서버 시작 시 디렉토리 확인
const releaseDir = path.join(__dirname, "../release");
console.log("서버 시작 - release 디렉토리 확인");
console.log("release 디렉토리 경로:", releaseDir);
console.log("release 디렉토리 존재 여부:", fs.existsSync(releaseDir));

if (fs.existsSync(releaseDir)) {
  try {
    const files = fs.readdirSync(releaseDir);
    console.log("release 디렉토리 내용:", files);
  } catch (err) {
    console.error("디렉토리 읽기 실패:", err);
  }
}

const PORT = process.env.UPDATE_SERVER_PORT || 80;
app.listen(PORT, () => {
  console.log(`업데이트 서버가 포트 ${PORT}에서 실행 중입니다`);
});
