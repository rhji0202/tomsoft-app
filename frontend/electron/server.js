const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const app = express();
const port = 58000;
const ProcessManager = require("./ProcessManager");
const { v4: uuidv4 } = require("uuid");

const processManager = new ProcessManager();

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
  const processId = uuidv4();
  let hasResponded = false;

  if (!image_url) {
    return res.status(400).json({
      success: false,
      error: "이미지 URL이 필요합니다",
    });
  }

  try {
    const processInfo = processManager.createProcess(processId, "remove-bg");

    const updateStatus = (status) => {
      if (processManager.getProcess(processId)) {
        processManager.updateProcess(processId, { status });
        app.emit("processing-status", {
          processId,
          type: "remove-bg",
          status,
        });
      }
    };

    updateStatus("processing");

    let executablePath;
    if (process.platform === "darwin") {
      // macOS
      executablePath =
        process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../backend/dist/background_remover")
          : path.join(process.resourcesPath, "background_remover");
    } else {
      // Windows
      executablePath =
        process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../backend/dist/background_remover.exe")
          : path.join(process.resourcesPath, "background_remover.exe");
    }

    if (!require("fs").existsSync(executablePath)) {
      throw new Error(`실행 파일을 찾을 수 없습니다: ${executablePath}`);
    }

    const removeBg = spawn(executablePath, [image_url, processId], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: path.dirname(executablePath),
    });

    let resultData = "";
    let errorData = "";

    removeBg.stdout.on("data", (data) => {
      console.log("프로세스 출력:", data.toString());
      resultData += data.toString();
    });

    removeBg.stderr.on("data", (data) => {
      const message = data.toString();
      if (message.includes("INFO")) {
        console.log("프로세스 로그:", message);
      } else {
        console.error("프로세스 에러:", message);
        errorData += message;
      }
    });

    const sendResponse = (success, data) => {
      if (!hasResponded) {
        hasResponded = true;
        if (success) {
          res.json(data);
        } else {
          res.status(500).json(data);
        }
      }
    };

    removeBg.on("close", (code) => {
      console.log("프로세스 종료 코드:", code);
      if (code === 0 && resultData) {
        updateStatus("completed");
        processManager.removeProcess(processId);
        sendResponse(true, {
          success: true,
          result: resultData.trim(),
          processId,
        });
      } else {
        updateStatus("error");
        processManager.removeProcess(processId);
        sendResponse(false, {
          success: false,
          error: "배경 제거 실패",
          processId,
          details: `프로세스가 코드 ${code}로 종료되었습니다`,
          errorOutput: errorData,
        });
      }
    });

    removeBg.on("error", (err) => {
      console.error("프로세스 실행 에러:", err);
      updateStatus("error");
      processManager.removeProcess(processId);
      sendResponse(false, {
        success: false,
        error: "프로세스 실행 오류",
        processId,
        details: err.message,
      });
    });
  } catch (error) {
    console.error("서버 에러:", error);
    updateStatus("error");
    processManager.removeProcess(processId);
    if (!hasResponded) {
      res.status(500).json({
        success: false,
        error: "서버 오류",
        processId,
        details: error.message,
      });
    }
  }
});

app.get("/status-events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const processes = Array.from(processManager.processes.values());
  if (processes.length > 0) {
    processes.forEach((process) => {
      sendEvent({
        processId: process.id,
        type: process.type,
        status: process.status,
      });
    });
  }

  app.on("processing-status", sendEvent);

  req.on("close", () => {
    app.removeListener("processing-status", sendEvent);
  });
});

app.get("/process/:processId", (req, res) => {
  const process = processManager.getProcess(req.params.processId);
  if (process) {
    res.json(process);
  } else {
    res.status(404).json({ error: "프로세스를 찾을 수 없습니다" });
  }
});

app.listen(port, () => {
  console.log(`Express 서버가 포트 ${port}에서 실행 중입니다`);
});
