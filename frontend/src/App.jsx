import React, { useState, useEffect } from "react";
import { ModelDownloader } from "./components/ModelDownloader";
import { ModelInstalled } from "./components/ModelInstalled";
import { MenuBar } from "./components/MenuBar";
import ProcessStatus from "./components/ProcessStatus";

function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [modelExists, setModelExists] = useState(false);
  const [processes, setProcesses] = useState(new Map());

  useEffect(() => {
    const checkModelStatus = async () => {
      const exists = await window.electron.invoke("check-model");
      setModelExists(exists);
    };

    // SSE 연결 설정
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:58000';
    const eventSource = new EventSource(`${BACKEND_URL}/status-events`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProcesses(prev => {
        const newProcesses = new Map(prev);
        newProcesses.set(data.processId, data);
        return newProcesses;
      });
      
      if (data.status === 'completed' || data.status === 'error') {
        setTimeout(() => {
          setProcesses(prev => {
            const newProcesses = new Map(prev);
            newProcesses.delete(data.processId);
            return newProcesses;
          });
        }, 3000);
      }
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <MenuBar />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96 h-full">
          <h1 className="text-2xl font-bold text-center mb-6">최신 AI 모델 다운로드</h1>

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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <ProcessStatus processes={processes} />

          <span className="text-xs text-gray-500">
            {modelExists
              ? `~/.u2net/${import.meta.env.VITE_MODEL_NAME || 'birefnet-general'}.onnx`
              : "모델을 다운로드 해주세요"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
