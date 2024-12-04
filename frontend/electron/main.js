const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { exec } = require("child_process");
let backendProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 개발 모드에서는 localhost:51733, 프로덕션에서는 dist/index.html 로드
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:51733");
    // 개발 도구 열기
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 백엔드 서버 시작
  startBackendServer();
}

function killProcessByPort(port) {
  return new Promise((resolve) => {
    const command =
      process.platform === "win32"
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port} -t`;

    exec(command, (error, stdout) => {
      if (error || !stdout) {
        resolve();
        return;
      }

      const pid =
        process.platform === "win32"
          ? stdout.split("\r\n")[0].split(/\s+/)[4]
          : stdout.trim();

      if (pid) {
        const killCommand =
          process.platform === "win32"
            ? `taskkill /F /PID ${pid} /T`
            : `kill -9 ${pid}`;

        exec(killCommand, () => resolve());
      } else {
        resolve();
      }
    });
  });
}

async function startBackendServer() {
  // 기존 프로세스 정리
  await killProcessByPort(58000);

  const executablePath = path.join(process.resourcesPath, "fastapi_server.exe");

  backendProcess = spawn(executablePath, [], {
    windowsHide: true, // 윈도우에서 콘솔 창 숨기기
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
  // 백엔드 프로세스 종료
  if (backendProcess) {
    backendProcess.kill();
  }
  // 포트를 사용하는 모든 프로세스 종료
  await killProcessByPort(58000);

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 앱 종료 시 백엔드 프로세스도 종료
app.on("before-quit", async () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  // 포트를 사용하는 모든 프로세스 종료
  await killProcessByPort(58000);
});
