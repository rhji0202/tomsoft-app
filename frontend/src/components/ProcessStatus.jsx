import React from "react";

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
    case "idle":
      return "준비중";
    case "processing":
      return "처리중";
    case "completed":
      return "완료";
    case "error":
      return "실패";
    default:
      return "대기중";
  }
};

const getProcessTypeText = (type) => {
  switch (type) {
    case "remove-bg":
      return "배경 지우기";
    default:
      return "알 수 없음";
  }
};

const ProcessStatusList = ({ processes }) => {
  const latestProcess = Array.from(processes.values())
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  return (
    <div className="flex flex-col gap-2">
      {latestProcess && (
        <div key={latestProcess.processId} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(latestProcess.status)}`}
          />
          <span className="text-sm text-gray-600">
            {`${getProcessTypeText(latestProcess.type)}: ${getStatusText(
              latestProcess.status
            )}`}
          </span>
        </div>
      )}
    </div>
  );
};

const ProcessStatus = ({ processes }) => {
  return (
    <div className="flex items-center gap-4">
      {processes.size > 0 ? (
        <ProcessStatusList processes={processes} />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-sm text-gray-600">대기중</span>
        </div>
      )}
    </div>
  );
};

export default ProcessStatus; 