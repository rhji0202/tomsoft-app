import React from "react";
import { Download } from "lucide-react";

export function ModelDownloader({ onDownload, isDownloading, progress }) {
  return (
    <div className="space-y-4">
      {isDownloading ? (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>다운로드 중...</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      ) : (
        <button
          onClick={onDownload}
          style={{ WebkitAppRegion: "no-drag" }}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                   flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={20} />
          <span>AI 모델 다운로드</span>
        </button>
      )}

      <p className="text-sm text-gray-500 text-center mt-4">
        BiRefNet-general-epoch_244.onnx
      </p>
    </div>
  );
}
