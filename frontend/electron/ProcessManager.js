class ProcessManager {
  constructor() {
    this.processes = new Map();
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
      Object.assign(process, updates);
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
}

module.exports = ProcessManager;
