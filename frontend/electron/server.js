const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const app = express();
const port = 58000;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express 서버가 실행 중입니다!");
});

app.get("/status", (req, res) => {
  res.json({ status: "online" });
});

app.post("/remove-bg", async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({
      success: false,
      error: "이미지 URL이 필요합니다",
    });
  }

  try {
    app.emit("processing-status", "processing");

    const exePath =
      process.env.NODE_ENV === "development"
        ? path.join(__dirname, "../../backend/dist/background_remover.exe")
        : path.join(process.resourcesPath, "background_remover.exe");

    const removeBg = spawn(exePath, [image_url], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let resultData = "";

    removeBg.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    removeBg.on("close", (code) => {
      if (code === 0 && resultData) {
        app.emit("processing-status", "completed");
        res.json({
          success: true,
          result: resultData.trim(),
        });
      } else {
        app.emit("processing-status", "error");
        res.status(500).json({
          success: false,
          error: "배경 제거 실패",
          details: `프로세스가 코드 ${code}로 종료되었습니다`,
        });
      }
    });

    removeBg.on("error", (err) => {
      app.emit("processing-status", "error");
      res.status(500).json({
        success: false,
        error: "프로세스 실행 오류",
        details: err.message,
      });
    });
  } catch (error) {
    app.emit("processing-status", "error");
    res.status(500).json({
      success: false,
      error: "서버 오류",
      details: error.message,
    });
  }
});

app.get("/status-events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (status) => {
    res.write(`data: ${JSON.stringify({ status })}\n\n`);
  };

  app.on("processing-status", sendEvent);

  req.on("close", () => {
    app.removeListener("processing-status", sendEvent);
  });
});

app.listen(port, () => {
  console.log(`Express 서버가 포트 ${port}에서 실행 중입니다`);
});
