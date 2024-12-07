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

    // 프로세스 상태 업데이트 구독
    const statusHandler = (data) => {
      console.log("프로세스 상태 업데이트:", data);
      setProcesses((prev) => {
        const newProcesses = new Map(prev);
        newProcesses.set(data.processId, {
          processId: data.processId,
          id: data.processId,
          type: data.type,
          status: data.status,
          timestamp: Date.now(),
        });

        if (data.status === "completed" || data.status === "error") {
          setTimeout(() => {
            setProcesses((prev) => {
              const newProcesses = new Map(prev);
              newProcesses.delete(data.processId);
              return newProcesses;
            });
          }, 3000);
        }

        return newProcesses;
      });
    };

    const subscription = window.electron.on("processing-status", statusHandler);
    checkModelStatus();

    return () => {
      window.electron.removeListener("processing-status", subscription);
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
      <div className="flex-1 grid grid-rows-1 place-items-center p-2 h-full">
        <div className="bg-white rounded-lg shadow-md w-full h-full p-8">
          <h1 className="text-2xl font-bold text-center mb-4">
            최신 AI 모델 다운로드
          </h1>

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

      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <ProcessStatus processes={processes} />

          <span className="text-xs text-gray-500">
            {modelExists
              ? `~/.u2net/${
                  import.meta.env.VITE_MODEL_NAME || "birefnet-general"
                }.onnx`
              : "모델을 다운로드 해주세요"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
