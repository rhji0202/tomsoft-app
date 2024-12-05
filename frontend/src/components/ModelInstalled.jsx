import React from "react";
import { CheckCircle } from "lucide-react";

export function ModelInstalled() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-6 text-green-600">
        <CheckCircle size={48} className="mb-2" />
        <h2 className="text-lg font-semibold">AI 모델 설치됨</h2>
        <p className="text-sm text-gray-500 mt-1">
          모델이 성공적으로 설치되었습니다
        </p>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        birefnet-general.onnx
      </p>
    </div>
  );
}
