const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
let backendProcess = null;

function startExpressServer() {
  require("./server.js");
}

function createWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: 400,
    height: 40,
    x: screenWidth - 400, // 화면 오른쪽에 위치
    y: screenHeight - 40, // 화면 하단에 위치
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    alwaysOnTop: true, // 항상 최상위에 표시
    icon: path.join(__dirname, "../src/assets/logo.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 개발 모드에서는 localhost:51733, 프로덕션에서는 dist/index.html 로드
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:51733");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 백엔드 서버 시작
  startExpressServer();

  ipcMain.handle("minimize-window", () => {
    win.minimize();
  });

  ipcMain.handle("close-window", () => {
    win.close();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
  // 백엔드 프로세스 종료
  if (backendProcess) {
    backendProcess.kill();
  }

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
});
