const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');


//Main Window settings

const customUserDataPath = path.join(app.getPath('appData'), 'Ergo', 'Notes In');
const CogitoUserDataPath = path.join(app.getPath('appData'), 'Ergo', 'Cogito');
app.setPath('userData', customUserDataPath)

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800, height: 600,
        alwaysOnTop: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        }
    })
    mainWindow.loadURL('http://localhost:5173')
}

//Utility for TitleBar

ipcMain.on("minimize", () => {
  console.log('[Main] Minimize requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on("close", () => {
  console.log('[Main] Close requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});
ipcMain.on("reload", () => {
  console.log('[Main] Reload requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
});
ipcMain.on("maximize", () => {
    console.log('[Main] Maximize requested');
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize(); // Torna alla dimensione precedente
        } else {
            mainWindow.maximize();
        }
    }
});

// Utility for Onboarding Data

function getOnboardingPath() {
  return path.join(app.getPath('userData'), 'onboarding.json');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
}
function readJson(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      console.error('Error reading JSON file:', error);
      return null;
    }
  }
  return null;
}

ipcMain.handle('get-onboarding-data', () => readJson(getOnboardingPath()));
ipcMain.handle('set-onboarding-data', (event, data) => writeJson(getOnboardingPath(), data));



// Utility for Cogito Integration
function getCogitoPath() {
  return path.join(CogitoUserDataPath, 'onboarding.json');
}
ipcMain.handle('get-cogito-data', () => readJson(getCogitoPath()));
ipcMain.handle("open-external", (event, url) => {
    shell.openExternal(url);
});


// Utility for Exams JSON

function getExamsPath() {
  return path.join(app.getPath('userData'), 'exams.json');
}

ipcMain.handle('load-exams-json', () => readJson(getExamsPath()) || []);
ipcMain.handle('save-exams-json', (event, data) => writeJson(getExamsPath(), data));


//App Lyfecycle

app.whenReady().then(() => {
    createMainWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
