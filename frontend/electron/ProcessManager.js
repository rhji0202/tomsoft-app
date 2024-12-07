const ServiceFactory = require("./services/ServiceFactory");
const eventEmitter = require("./events");

class ProcessManager {
  constructor(maxConcurrent = 2) {
    this.processes = new Map();
    this.queue = [];
    this.maxConcurrent = maxConcurrent;
    this.activeProcessCount = 0;
    this.serviceFactory = new ServiceFactory(this);
    this.syncQueue = []; // 동기 작업 큐
    this.isProcessingQueue = false; // 큐 처리 상태
  }

  async initializePool() {
    if (this.processPool) return;

    const executablePath = this.getExecutablePath();
    this.processPool = spawn(executablePath, ["--daemon"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: path.dirname(executablePath),
    });

    // 데몬 프로세스 에러 처리
    this.processPool.on("error", (error) => {
      console.error("프로세스 풀 에러:", error);
      this.processPool = null;
    });
  }

  // 동기 작업 추가
  async addToSyncQueue(processId, type, data) {
    const queueItem = {
      id: processId,
      type,
      data,
      status: "queued",
      timestamp: Date.now(),
    };

    // 큐에 추가하고 상태 업데이트
    this.syncQueue.push(queueItem);
    this.processes.set(processId, queueItem);

    // 큐 상태 이벤트 발생
    this.emitStatus(processId, type, "queued");

    // 이전 작업이 완료될 때까지 대기
    while (this.syncQueue[0]?.id !== processId) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      // 처리 중 상태로 업데이트
      this.emitStatus(processId, type, "processing");

      const result = await this.processItem(queueItem);
      this.syncQueue.shift();

      // 완료 상태로 업데이트
      this.emitStatus(processId, type, "completed");

      return result;
    } catch (error) {
      this.syncQueue.shift();

      // 에러 상태로 업데이트
      this.emitStatus(processId, type, "error");

      throw error;
    }
  }

  // 비동기 작업 추가
  async addToQueue(processId, type, data) {
    const queueItem = {
      id: processId,
      type,
      data,
      status: "queued",
      timestamp: Date.now(),
    };

    // 큐에 추가하고 프로세스 맵에도 저장
    this.queue.push(queueItem);
    this.processes.set(processId, queueItem);

    // 큐 추가 시 상태 업데이트
    this.emitStatus(processId, type, "queued");

    // 백그라운드에서 큐 처리 시작
    if (!this.isProcessingQueue) {
      this.processQueueBackground();
    }

    return queueItem;
  }

  // 백그라운드에서 큐 처리
  async processQueueBackground() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.queue.length > 0) {
        if (this.activeProcessCount >= this.maxConcurrent) {
          // 동시 실행 제한에 도달하면 잠시 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const item = this.queue.shift();
        this.activeProcessCount++;

        // 비동기로 작업 처리
        this.processItem(item)
          .catch((error) => {
            console.error(`작업 처리 실패 (${item.id}):`, error);
          })
          .finally(() => {
            this.activeProcessCount--;
          });
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 새로운 프로세스 상태 생성
  createProcess(processId, type) {
    const process = {
      id: processId,
      type: type,
      status: "idle",
      startTime: Date.now(),
      progress: 0,
    };
    this.processes.set(processId, process);
    return process;
  }

  // 프로세스 상태 업데이트
  updateProcess(processId, updates) {
    const process = this.processes.get(processId);
    if (process) {
      Object.assign(process, updates, {
        timestamp: Date.now(),
      });
      return process;
    }
    return null;
  }

  // 프로세스 상태 조회
  getProcess(processId) {
    return this.processes.get(processId);
  }

  // 프로세스 완료 후 정리
  removeProcess(processId) {
    this.processes.delete(processId);
  }

  // 특정 타입의 모든 프로세스 조회
  getProcessesByType(type) {
    return Array.from(this.processes.values()).filter(
      (process) => process.type === type
    );
  }

  async processItem(item) {
    const service = this.serviceFactory.getService(item.type);
    return service.process(item);
  }

  // 프로세스 강제 종료
  killProcess(processId) {
    const process = this.processes.get(processId);
    if (process?.pid) {
      try {
        process.kill("SIGTERM");
      } catch (e) {
        console.error(`프로세스 ${processId} 종료 실패:`, e);
      }
    }
  }

  // 모든 프로세스 종료
  killAllProcesses() {
    for (const [processId, process] of this.processes) {
      this.killProcess(processId);
    }
    this.processes.clear();
    this.queue = [];
    this.syncQueue = [];
  }

  // 상태 업데이트 시 이벤트 발생
  emitStatus(processId, type, status) {
    eventEmitter.emit("processing-status", {
      processId,
      type,
      status,
      timestamp: Date.now(),
    });
  }
}

module.exports = ProcessManager;
