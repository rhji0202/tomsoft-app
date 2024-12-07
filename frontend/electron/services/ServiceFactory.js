const RemoveBgService = require("./RemoveBgService");

class ServiceFactory {
  constructor(processManager) {
    this.processManager = processManager;
    this.services = new Map();
  }

  getService(type) {
    if (!this.services.has(type)) {
      switch (type) {
        case "remove-bg":
          this.services.set(type, new RemoveBgService(this.processManager));
          break;
        // 새로운 서비스 타입 추가
        default:
          throw new Error(`Unknown service type: ${type}`);
      }
    }
    return this.services.get(type);
  }
}

module.exports = ServiceFactory;
