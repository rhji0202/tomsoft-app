const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const https = require("https");
const fs = require("fs");
const os = require("os");
let backendProcess = null;

function startExpressServer() {
  require("./server.js");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    alwaysOnTop: true,
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

  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }
}

ipcMain.handle("download-model", async (event) => {
  const modelName = process.env.VITE_MODEL_NAME || "birefnet-general";
  const modelUrl =
    process.env.VITE_MODEL_URL ||
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx";

  // OS별 모델 저장 경로 설정
  const homeDir = os.homedir();
  const modelDir = path.join(homeDir, ".u2net");
  const modelPath = path.join(modelDir, `${modelName}.onnx`);

  // .u2net 디렉토리가 없으면 생성
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(modelPath);
    let receivedBytes = 0;

    const request = https.get(
      modelUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (response) => {
        // 리다이렉트 처리
        if (response.statusCode === 302 || response.statusCode === 301) {
          https
            .get(
              response.headers.location,
              {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
              },
              (redirectResponse) => {
                const totalBytes = parseInt(
                  redirectResponse.headers["content-length"],
                  10
                );

                redirectResponse.on("data", (chunk) => {
                  receivedBytes += chunk.length;
                  const percentage = (receivedBytes / totalBytes) * 100;
                  const progress = Math.max(1, Math.round(percentage));

                  // console.log("Sending progress from main:", {
                  //   receivedBytes,
                  //   totalBytes,
                  //   percentage: percentage.toFixed(2),
                  //   progress,
                  //   calculation: `(${receivedBytes} / ${totalBytes}) * 100 = ${percentage.toFixed(
                  //     2
                  //   )}% → ${progress}%`,
                  // });

                  event.sender.send("download-progress", progress);
                  file.write(chunk);
                });

                redirectResponse.on("end", () => {
                  file.end();
                  resolve({ success: true });
                });
              }
            )
            .on("error", (err) => {
              file.end();
              fs.unlink(modelPath, () => {});
              reject({
                success: false,
                error: err.message || "다운로드 중 오류가 발생했습니다.",
              });
            });
        } else {
          const totalBytes = parseInt(response.headers["content-length"], 10);

          response.on("data", (chunk) => {
            receivedBytes += chunk.length;
            const percentage = (receivedBytes / totalBytes) * 100;
            const progress = Math.max(1, Math.round(percentage));

            // console.log("Sending progress from main:", {
            //   receivedBytes,
            //   totalBytes,
            //   percentage: percentage.toFixed(2),
            //   progress,
            //   calculation: `(${receivedBytes} / ${totalBytes}) * 100 = ${percentage.toFixed(
            //     2
            //   )}% → ${progress}%`,
            // });

            event.sender.send("download-progress", progress);
            file.write(chunk);
          });

          response.on("end", () => {
            file.end();
            resolve({ success: true });
          });
        }
      }
    );

    request.on("error", (err) => {
      file.end();
      fs.unlink(modelPath, () => {});
      reject({
        success: false,
        error: err.message || "다운로드 중 오류가 발생했습니다.",
      });
    });
  });
});

ipcMain.handle("check-model", async () => {
  const modelName = process.env.VITE_MODEL_NAME || "birefnet-general";
  const homeDir = os.homedir();
  const modelPath = path.join(homeDir, ".u2net", `${modelName}.onnx`);
  return fs.existsSync(modelPath);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
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

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
