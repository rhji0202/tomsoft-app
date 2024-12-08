const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const https = require("https");
const fs = require("fs");
const os = require("os");
const eventEmitter = require("./events");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
let backendProcess = null;

function startExpressServer() {
  const server = require("./server.js");
  server.on("processing-status", forwardStatusToRenderer);
}

// 핸들러들을 한 번만 등록하도록 전역으로 이동
ipcMain.handle("minimize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle("close-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

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

  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  // 프로세스 상태 업데이트 이벤트 전달
  global.mainWindow = win; // 메인 윈도우 전역 저장
}

// Express 서버에서 발생하는 이벤트를 렌더러로 전달
function forwardStatusToRenderer(data) {
  if (global.mainWindow) {
    console.log("상태 업데이트 전달:", data);
    global.mainWindow.webContents.send("processing-status", data);
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
        error: err.message || "다운로드 중 오류가 생했습니다.",
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

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// 수동으로 업데이트 체크를 트리거하는 IPC 핸들러 추가
ipcMain.handle("check-for-updates", async (event) => {
  try {
    const result = await autoUpdater.checkForUpdates();
    // 중요: 직렬화 가능한 데이터만 반환
    return {
      version: result.updateInfo.version,
      files: result.updateInfo.files,
      releaseDate: result.updateInfo.releaseDate,
      // 필요한 다른 직렬화 가능한 데이터
    };
  } catch (error) {
    console.error("Update check failed:", error);
    return null;
  }
});

function initAutoUpdater() {
  // macOS 앱 번들 ID 설정
  if (process.platform === "darwin") {
    app.setAppUserModelId("com.theonemind.utility");
  }

  // 로깅 설정
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "silly";
  autoUpdater.logger.transports.console.level = "silly";

  // 업데이트 설정
  const server =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://updates.theonemind.com";

  // autoUpdater 설정
  autoUpdater.setFeedURL({
    provider: "generic",
    url: server,
    updaterCacheDirName: "theonemind-updater",
    channel: "latest",
    appId: "com.theonemind.utility",
    requestHeaders: {
      "User-Agent": "TheOneMindUtility",
    },
  });

  // 개발 환경에서의 설정
  if (process.env.NODE_ENV === "development") {
    autoUpdater.updateConfigPath = path.join(__dirname, "dev-app-update.yml");
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.allowDowngrade = true;
    autoUpdater.allowPrerelease = true;
    autoUpdater.autoInstallOnAppQuit = false;
    process.env.CSC_IDENTITY_AUTO_DISCOVERY = false;

    // Squirrel.Mac 캐시 디렉토리 설정
    process.env.SQUIRREL_UPDATES_PATH = path.join(
      app.getPath("userData"),
      "theonemind-updater"
    );
  }

  // macOS에서 추가 설정
  if (process.platform === "darwin") {
    autoUpdater.on("before-quit-for-update", () => {
      app.quit();
    });
  }

  // 업데이트 확인
  autoUpdater.on("checking-for-update", () => {
    log.info("업데이트 확인 중...");
  });

  // 업데이트 가능
  autoUpdater.on("update-available", (info) => {
    log.info("업데이트 가능:", info);
    log.info("다운로드할 파일 정보:", {
      version: info.version,
      files: info.files,
      path: info.path,
      sha512: info.sha512,
    });

    dialog
      .showMessageBox({
        type: "info",
        title: "업데이트 알림",
        message: "새로운 버전이 있습니다. 지금 업데이트하시겠습니까?",
        buttons: ["예", "아니오"],
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          log.info("업데이트 다운로드 시작");
          try {
            // 다운로드 시작 전에 이벤트 리스너 설정
            autoUpdater.on("download-progress", (progress) => {
              log.info("다운로드 진행률 상세:", {
                percent: progress.percent,
                transferred: progress.transferred,
                total: progress.total,
                bytesPerSecond: progress.bytesPerSecond,
              });
              if (global.mainWindow) {
                global.mainWindow.webContents.send(
                  "update-progress",
                  progress.percent
                );
              }
            });

            // 다운로드 시작
            log.info("다운로드 시작 시도");
            autoUpdater.downloadUpdate().catch((err) => {
              log.error("다운로드 시작 실패:", err);
              log.error("실패 세부 정보:", {
                code: err.code,
                message: err.message,
                stack: err.stack,
              });
              dialog.showErrorBox(
                "다운로드 오류",
                `업데이트 다운로드를 시작할 수 없습니다: ${err.message}`
              );
            });
          } catch (err) {
            log.error("downloadUpdate 호출 실패:", err);
          }
        } else {
          log.info("업데이트 다운로드 취소됨");
          autoUpdater.removeAllListeners("update-downloaded");
          autoUpdater.removeAllListeners("download-progress");
        }
      })
      .catch((err) => {
        log.error("업데이트 다이얼로그 에러:", err);
      });
  });

  // 업데이트 없음
  autoUpdater.on("update-not-available", (info) => {
    log.info("업데이트 없음:", info);
  });

  // 업데이트 다운로드 완료
  autoUpdater.on("update-downloaded", (info) => {
    log.info("업데이트 다운로드 완료:", info);
    dialog
      .showMessageBox({
        type: "info",
        title: "업데이트 준비 완료",
        message: "업데이트가 다운로드되었습니다. 지금 설치하시겠습니까?",
        buttons: ["예", "나중에"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          log.info("업데이트 설치 시작");
          autoUpdater.quitAndInstall(false, true);
        } else {
          log.info("업데이트 설치 연기");
        }
      })
      .catch((err) => {
        log.error("설치 다이얼로그 에러:", err);
      });
  });

  // 에러 처리
  autoUpdater.on("error", (err) => {
    log.error("업데이트 오류:", err);
    log.error("오류 세부 정보:", {
      code: err.code,
      domain: err.domain,
      stack: err.stack,
    });
    dialog.showErrorBox(
      "업데이트 오류",
      `업데이트 중 오류가 발생했습니다: ${err.message}`
    );
  });

  // 주기적으로 업데이트 확인 (4시간마��)
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 1000 * 60 * 60 * 4);

  // 이벤트 리스너 추가
  autoUpdater.on("error", (err) => {
    console.error("업데이트 오류:", err);
    console.error("스택:", err.stack);
  });
}

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();
  // 앱 시작 시 즉시 업데이트 확인
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("Initial update check failed:", err);
  });
});

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
