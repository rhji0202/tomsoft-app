const { contextBridge, ipcRenderer } = require("electron");

// 메인 프로세스와 렌더러 프로세스 간의 안전한 통신을 위한 API 노출
contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  close: () => ipcRenderer.invoke("close-window"),
});
