import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

export function ModelInstalled() {
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    const getVersion = async () => {
      const version = await window.electron.invoke("get-app-version");
      setAppVersion(version);
    };
    getVersion();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-4 text-green-600">
        <CheckCircle size={48} className="mb-2" />
        <h2 className="text-lg font-semibold">AI 모델 설치됨</h2>
        <p className="text-sm text-gray-500 mt-1">
          모델이 성공적으로 설치되었습니다
        </p>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">birefnet-general.onnx</p>
        <p className="text-xs text-gray-400">앱 버전: {appVersion}</p>
      </div>
    </div>
  );
}
