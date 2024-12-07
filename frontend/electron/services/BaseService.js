const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class BaseService {
  constructor(processManager) {
    this.processManager = processManager;
  }

  getExecutablePath() {
    throw new Error("getExecutablePath must be implemented");
  }

  getCommandArgs(item) {
    throw new Error("getCommandArgs must be implemented");
  }

  async process(item) {
    return new Promise((resolve, reject) => {
      const executablePath = this.getExecutablePath();
      let resultData = "";
      let errorData = "";
      let isProcessing = true;

      // 타임아웃 설정
      const timeout = setTimeout(() => {
        if (isProcessing) {
          this.handleError(item, -1, "처리 시간 초과", reject);
        }
      }, 300000); // 5분

      try {
        const process = spawn(executablePath, this.getCommandArgs(item), {
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
          cwd: path.dirname(executablePath),
        });

        this.processManager.updateProcess(item.id, {
          status: "processing",
          pid: process.pid,
        });

        process.stdout.on("data", (data) => {
          console.log("프로세스 출력:", data.toString());
          resultData += data.toString();
        });

        process.stderr.on("data", (data) => {
          const message = data.toString();
          if (message.includes("INFO")) {
            console.log("프로세스 로그:", message);
          } else {
            console.error("프로세스 에러:", message);
            errorData += message;
          }
        });

        process.on("close", (code) => {
          isProcessing = false;
          clearTimeout(timeout);

          if (code === 0) {
            const result = resultData.trim();
            this.processManager.updateProcess(item.id, {
              status: "completed",
              result: result,
            });
            this.emitStatus(item, "completed");

            const response = {
              success: true,
              result: result,
              processId: item.id,
            };

            // 동기 작업인 경우에만 HTTP 응답
            if (!item.data.async && item.data.res) {
              item.data.res.json(response);
            }

            resolve(response); // 항상 결과 객체 반환
          } else {
            const errorResponse = {
              success: false,
              error: "처리 실패",
              processId: item.id,
              details: errorData || `프로세스가 코드 ${code}로 종료되었습니다`,
            };

            this.processManager.updateProcess(item.id, {
              status: "error",
              error: errorResponse.details,
            });
            this.emitStatus(item, "error");

            // 동기 작업인 경우에만 HTTP 응답
            if (!item.data.async && item.data.res) {
              item.data.res.status(500).json(errorResponse);
            }

            reject(errorResponse);
          }

          this.processManager.removeProcess(item.id);
        });

        process.on("error", (err) => {
          isProcessing = false;
          clearTimeout(timeout);

          const errorResponse = {
            success: false,
            error: "프로세스 실행 오류",
            processId: item.id,
            details: err.message,
          };

          this.processManager.updateProcess(item.id, {
            status: "error",
            error: err.message,
          });
          this.emitStatus(item, "error");

          // 동기 작업인 경우에만 HTTP 응답
          if (!item.data.async && item.data.res) {
            item.data.res.status(500).json(errorResponse);
          }

          this.processManager.removeProcess(item.id);
          reject(errorResponse);
        });
      } catch (error) {
        isProcessing = false;
        clearTimeout(timeout);

        const errorResponse = {
          success: false,
          error: "실행 오류",
          processId: item.id,
          details: error.message,
        };

        this.processManager.updateProcess(item.id, {
          status: "error",
          error: error.message,
        });
        this.emitStatus(item, "error");

        if (!item.data.async && item.data.res) {
          item.data.res.status(500).json(errorResponse);
        }

        reject(errorResponse);
      }
    });
  }

  handleProcessEvents(
    process,
    item,
    resultData,
    errorData,
    resolve,
    reject,
    cleanup
  ) {
    const killProcess = () => {
      try {
        process.kill("SIGTERM");
      } catch (e) {
        console.error("프로세스 종료 실패:", e);
      }
    };

    process.on("close", (code) => {
      cleanup();
      if (code === 0) {
        this.handleSuccess(item, resultData || "success", resolve);
      } else {
        this.handleError(item, code, errorData, reject);
      }
      this.processManager.removeProcess(item.id);
    });

    process.on("error", (err) => {
      cleanup();
      this.handleProcessError(item, err, reject);
      this.processManager.removeProcess(item.id);
      killProcess();
    });

    // 프로세스 중단 처리
    process.on("SIGTERM", () => {
      cleanup();
      killProcess();
    });
  }

  handleSuccess(item, resultData, resolve) {
    const result = resultData.trim();

    this.processManager.updateProcess(item.id, {
      status: "completed",
      result: result,
    });
    this.emitStatus(item, "completed");

    const response = {
      success: true,
      result: result,
      processId: item.id,
    };

    // 동기 작업인 경우에만 HTTP 응답
    if (!item.data.async && item.data.res) {
      item.data.res.json(response);
    }

    resolve(response);
  }

  handleError(item, code, errorData, reject) {
    // 코드가 0인 경우는 에러로 처리하지 않음
    if (code === 0) {
      return this.handleSuccess(item, errorData || "success", resolve);
    }

    this.processManager.updateProcess(item.id, {
      status: "error",
      error: errorData,
    });
    this.emitStatus(item, "error");

    const errorResponse = {
      success: false,
      error: "처리 실패",
      processId: item.id,
      details:
        code === -1 ? errorData : `프로세스가 코드 ${code}로 종료되었습니다`,
      errorOutput: errorData,
    };

    // 동기 작업인 경우에만 HTTP 응답
    if (!item.data.async && item.data.res) {
      item.data.res.status(500).json(errorResponse);
    }

    reject(new Error(errorResponse.details));
  }

  handleProcessError(item, err, reject) {
    console.error("프로세스 실행 에러:", err);
    this.processManager.updateProcess(item.id, {
      status: "error",
      error: err.message,
    });
    this.emitStatus(item, "error");

    // 동기 작업인 경우에만 HTTP 응답
    if (!item.data.async && item.data.res) {
      item.data.res.status(500).json({
        success: false,
        error: "프로세스 실행 오류",
        processId: item.id,
        details: err.message,
      });
    }

    reject(err);
  }

  emitStatus(item, status) {
    global.app?.emit("processing-status", {
      processId: item.id,
      type: item.type,
      status: status,
    });
  }
}

module.exports = BaseService;
