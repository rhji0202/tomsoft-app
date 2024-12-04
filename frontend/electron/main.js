const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
let pythonProcess = null;

function getPythonPath() {
  const isDevMode = process.env.NODE_ENV === "development";
  const baseDir = isDevMode
    ? path.join(__dirname, "../../backend")
    : path.join(process.resourcesPath, "backend");

  // Windows와 macOS의 경로 차이를 처리
  if (process.platform === "win32") {
    return path.join(baseDir, "venv/Scripts/python.exe");
  } else {
    // macOS와 Linux
    return path.join(baseDir, "venv/bin/python");
  }
}

function startFastAPIServer() {
  const pythonPath = getPythonPath();
  const cwd =
    process.env.NODE_ENV === "development"
      ? path.join(__dirname, "../../backend")
      : path.join(process.resourcesPath, "backend");

  console.log("Starting FastAPI server...");
  console.log("Python Path:", pythonPath);
  console.log("Working Directory:", cwd);

  // FastAPI 서버 시작 (--reload 옵션 추가)
  pythonProcess = spawn(
    pythonPath,
    [
      "-m",
      "uvicorn",
      "app.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      "8000",
      "--reload",
    ],
    {
      cwd,
      env: { ...process.env, PYTHONPATH: cwd }, // PYTHONPATH 설정 추가
    }
  );

  pythonProcess.stdout.on("data", (data) => {
    console.log(`FastAPI: ${data.toString()}`); // Buffer를 문자열로 변환
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`FastAPI Error: ${data.toString()}`); // Buffer를 문자열로 변환
  });

  pythonProcess.on("error", (error) => {
    console.error("Failed to start Python process:", error);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(`Python process exited with code ${code} and signal ${signal}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 개발자 도구를 항상 열어서 로그 확인
  win.webContents.openDevTools();

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  startFastAPIServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
