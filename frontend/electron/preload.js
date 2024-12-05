const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  close: () => ipcRenderer.invoke("close-window"),
  invoke: (channel, ...args) => {
    const validChannels = ["check-model", "download-model"];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  on: (channel, callback) => {
    const validChannels = ["download-progress"];
    if (validChannels.includes(channel)) {
      const subscription = (_event, value) => callback(value);
      ipcRenderer.on(channel, subscription);
      return subscription;
    }
  },
  removeListener: (channel, callback) => {
    const validChannels = ["download-progress"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});
