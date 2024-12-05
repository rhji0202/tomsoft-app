import React, { useState, useEffect } from "react";
import { ModelDownloader } from "./components/ModelDownloader";
import { ModelInstalled } from "./components/ModelInstalled";

function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [modelExists, setModelExists] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("idle"); // 'idle', 'processing', 'completed', 'error'

  useEffect(() => {
    const checkModelStatus = async () => {
      const exists = await window.electron.invoke("check-model");
      setModelExists(exists);
    };

    // SSE 연결 설정
    const eventSource = new EventSource("http://localhost:58000/status-events");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProcessingStatus(data.status);
    };

    checkModelStatus();

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      console.log("다운로드 시작");

      // 다운로드 진행 상태를 모니터링하는 이벤트 리스너
      const progressHandler = (progress) => {
        console.log("Download progress in handler:", progress);
        setDownloadProgress(Number(progress));
      };

      const subscription = window.electron.on(
        "download-progress",
        progressHandler
      );

      await window.electron.invoke("download-model");

      console.log("다운로드 완료");
      window.electron.removeListener("download-progress", subscription);
      setIsDownloading(false);
      setModelExists(true);
    } catch (error) {
      console.error("다운로드 실패:", error);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "processing":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "processing":
        return "배경 제거 처리중";
      case "completed":
        return "처리 완료";
      case "error":
        return "처리 실패";
      default:
        return "대기중";
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100"
      style={{ WebkitAppRegion: "drag" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">모델 다운로드</h1>

        {modelExists ? (
          <ModelInstalled />
        ) : (
          <ModelDownloader
            onDownload={handleDownload}
            isDownloading={isDownloading}
            progress={downloadProgress}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <div className="flex items-center gap-4">
            {/* 처리 상태 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  processingStatus
                )}`}
              />
              <span className="text-sm text-gray-600">
                {getStatusText(processingStatus)}
              </span>
            </div>
          </div>

          <span className="text-xs text-gray-500">
            {modelExists
              ? "~/.u2net/birefnet-general.onnx"
              : "모델을 다운로드 해주세요"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
