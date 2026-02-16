const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const xlsx = require('xlsx');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });

  if (filePaths && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('extract-data', async (event, filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming you want the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); //header: 1 returns array of arrays

    return data;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
});