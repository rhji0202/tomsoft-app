const BaseService = require("./BaseService");

class ResizeImageService extends BaseService {
  getExecutablePath() {
    // 리사이즈 실행 파일 경로 반환
  }

  getCommandArgs(item) {
    return [item.data.image_url, item.data.width, item.data.height];
  }
}
