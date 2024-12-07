const BaseService = require("./BaseService");
const path = require("path");
const fs = require("fs");

class RemoveBgService extends BaseService {
  getExecutablePath() {
    let executablePath;
    if (process.platform === "darwin") {
      executablePath =
        process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../../backend/dist/background_remover")
          : path.join(process.resourcesPath, "background_remover");
    } else {
      executablePath =
        process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../../backend/dist/background_remover.exe")
          : path.join(process.resourcesPath, "background_remover.exe");
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(`실행 파일을 찾을 수 없습니다: ${executablePath}`);
    }

    return executablePath;
  }

  getCommandArgs(item) {
    return [item.data.image_url, item.id];
  }
}

module.exports = RemoveBgService;
