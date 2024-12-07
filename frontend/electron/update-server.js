const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// 개발 환경을 위한 설정 추가
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // 요청 로깅
  next();
});

// yml 파일 서비스를 위한 라우트 추가
app.get("/latest-mac.yml", (req, res) => {
  const ymlPath = path.join(__dirname, "updates/latest-mac.yml");
  if (fs.existsSync(ymlPath)) {
    res.sendFile(ymlPath);
  } else {
    res.status(404).send("Update file not found");
  }
});

app.get("/latest.yml", (req, res) => {
  const ymlPath = path.join(__dirname, "updates/latest.yml");
  if (fs.existsSync(ymlPath)) {
    res.sendFile(ymlPath);
  } else {
    res.status(404).send("Update file not found");
  }
});

// 에러 핸들링 추가
app.use((err, req, res, next) => {
  console.error("서버 에러:", err);
  res.status(500).json({ error: err.message });
});

// 업데이트 정�를 제공하는 엔드포인트
app.get("/update/:platform/:version", (req, res) => {
  const { platform, version } = req.params;

  // package.json에서 현재 버전 정보 읽기
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"))
  );
  const latestVersion = packageJson.version;

  if (version === latestVersion) {
    res.status(204).send();
    return;
  }

  const serverUrl = process.env.UPDATE_SERVER_URL || "http://localhost:3000";

  // 플랫폼별 응답 구성
  if (platform === "darwin") {
    // macOS용 응답
    const updateInfo = {
      version: latestVersion,
      files: [
        {
          url: `${serverUrl}/downloads/TheOneMindUtility-${latestVersion}-arm64.dmg`,
          sha512:
            "c36bdf110d2122b6e742d5f684eb2b1ef64aeefe9d6699981c072daa1af5ad70aece8f6d66b3c86a5af4ea4ec3c5850f6e78fb8f5755e3ae21f3fb84f3a69dbf",
          size: 236639959,
        },
      ],
      path: `TheOneMindUtility-${latestVersion}-arm64.dmg`,
      sha512:
        "c36bdf110d2122b6e742d5f684eb2b1ef64aeefe9d6699981c072daa1af5ad70aece8f6d66b3c86a5af4ea4ec3c5850f6e78fb8f5755e3ae21f3fb84f3a69dbf",
      releaseDate: new Date().toISOString(),
    };

    res.json(updateInfo);
  } else if (platform === "win32") {
    // Windows용 응답
    const updateInfo = {
      version: latestVersion,
      files: [
        {
          url: `${serverUrl}/downloads/TheOneMindUtility-${latestVersion}-setup.exe`,
          sha512: "sha512-windows-hash",
          size: 0, // 실제 Windows 파일 크기로 변경 필요
        },
      ],
      path: `TheOneMindUtility-${latestVersion}-setup.exe`,
      sha512: "sha512-windows-hash",
      releaseDate: new Date().toISOString(),
    };

    res.json(updateInfo);
  } else {
    res.status(400).json({ error: "지원하지 않는 플랫폼입니다." });
  }
});

// 업데이트 파일 제공을 위한 정적 파일 서버
app.use("/downloads", express.static(path.join(__dirname, "updates")));

const PORT = process.env.UPDATE_SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`업데이트 서버가 포트 ${PORT}에서 실행 중입니다`);
});
