import React, { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

export function ModelDownloader({ onDownload, isDownloading, progress }) {
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setError(null);
      await onDownload();
    } catch (err) {
      setError(err.message || "다운로드 실패");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

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
          onClick={handleDownload}
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
