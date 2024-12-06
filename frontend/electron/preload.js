const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, data) => {
    const validChannels = [
      "check-model",
      "download-model",
      "minimize-window",
      "close-window",
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  on: (channel, callback) => {
    const validChannels = ["download-progress"];
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return subscription;
    }
  },
  removeListener: (channel, subscription) => {
    const validChannels = ["download-progress"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, subscription);
    }
  },
});
