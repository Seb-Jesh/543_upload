const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  extractData: (filePath) => ipcRenderer.invoke('extract-data', filePath),
});