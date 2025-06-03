const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const { shell } = require("electron");
const { protocol } = require("electron");


//Main Window settings

const customUserDataPath = path.join(
  app.getPath("appData"),
  "Ergo",
  "ExamShelf"
);
const CogitoUserDataPath = path.join(app.getPath("appData"), "Ergo", "Cogito");
app.setPath("userData", customUserDataPath);

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

//Utility for TitleBar

ipcMain.on("minimize", () => {
  console.log("[Main] Minimize requested");
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on("close", () => {
  console.log("[Main] Close requested");
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});
ipcMain.on("reload", () => {
  console.log("[Main] Reload requested");
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
});
ipcMain.on("maximize", () => {
  console.log("[Main] Maximize requested");
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
  return path.join(app.getPath("userData"), "onboarding.json");
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
      console.error("Error reading JSON file:", error);
      return null;
    }
  }
  return null;
}

ipcMain.handle("get-onboarding-data", () => readJson(getOnboardingPath()));
ipcMain.handle("set-onboarding-data", (event, data) =>
  writeJson(getOnboardingPath(), data)
);

// Utility for Cogito Integration
function getCogitoPath() {
  return path.join(CogitoUserDataPath, "onboarding.json");
}

function getExamIntegrationPath() {
  return path.join(CogitoUserDataPath, "ExamIntegration.json");
}
ipcMain.handle("get-exam-integration-data", () =>
  readJson(getExamIntegrationPath()));
ipcMain.handle("get-cogito-data", () => readJson(getCogitoPath()));
ipcMain.handle("open-external", (event, url) => {
  shell.openExternal(url);
});

// Utility for Exams JSON

function getExamsPath() {
  return path.join(app.getPath("userData"), "exams.json");
}

ipcMain.handle("load-exams-json", () => readJson(getExamsPath()) || []);
ipcMain.handle("save-exams-json", (event, data) =>
  writeJson(getExamsPath(), data)
);

// Utility for Exams Folders

function getExamsDir() {
  const dir = path.join(app.getPath("userData"), "Exams");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Crea cartella esame
ipcMain.handle("create-exam-folder", (event, examName) => {
  const folderPath = path.join(getExamsDir(), examName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
  return true;
});

ipcMain.handle("create-exam-json", (event, examName) => {
  const examDir = path.join(getExamsDir(), examName);
  const examJsonPath = path.join(examDir, "exam.json");
  if (!fs.existsSync(examDir)) fs.mkdirSync(examDir, { recursive: true });
  if (!fs.existsSync(examJsonPath)) {
    fs.writeFileSync(examJsonPath, JSON.stringify([], null, 2));
    return true;
  }
  return false; // già esiste
});


// Elimina cartella esame
ipcMain.handle("delete-exam-folder", (event, examName) => {
  const folderPath = path.join(getExamsDir(), examName);
  if (fs.existsSync(folderPath))
    fs.rmSync(folderPath, { recursive: true, force: true });
  return true;
});

// Rinomina cartella esame
ipcMain.handle("rename-exam-folder", (event, oldName, newName) => {
  if (!oldName || !newName) {
    console.error(
      "rename-exam-folder: oldName or newName is missing",
      oldName,
      newName
    );
    return false;
  }
  const oldPath = path.join(getExamsDir(), oldName);
  const newPath = path.join(getExamsDir(), newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    return true;
  }
  return false;
});

// Utility for PDF Files in Exam Folders

ipcMain.handle("list-pdf-files", (event, examName) => {
  const dir = path.join(getExamsDir(), examName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
});

ipcMain.handle("set-exam-json", (event, examName, data) => {
  const examDir = path.join(getExamsDir(), examName);
  const examJsonPath = path.join(examDir, "exam.json");
  try {
    fs.writeFileSync(examJsonPath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Error writing exam.json:", e);
    return false;
  }
});

ipcMain.handle("get-exam-json", (event, examName) => {
  const examDir = path.join(getExamsDir(), examName);
  const examJsonPath = path.join(examDir, "exam.json");
  if (!fs.existsSync(examJsonPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(examJsonPath));
  } catch (e) {
    console.error("Error reading exam.json:", e);
    return [];
  }
});

ipcMain.handle("get-pdf-base64-from-path", (event, filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("base64");
  } catch (e) {
    console.error("Error reading PDF for preview:", e);
    return null;
  }
});

// Restituisce il path assoluto di un PDF (serve per react-pdf)
ipcMain.handle("get-pdf-path", (event, examName, fileName) => {
  return path.join(getExamsDir(), examName, fileName);
});

ipcMain.handle("open-pdf-dialog", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    properties: ["openFile"],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// Handler per copiare il PDF selezionato nella cartella dell'esame
ipcMain.handle("add-pdf-to-exam", (event, examName, filePath) => {
  if (!filePath) return false;
  const destDir = path.join(getExamsDir(), examName);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const fileName = path.basename(filePath);
  const destPath = path.join(destDir, fileName);
  fs.copyFileSync(filePath, destPath);
  return true;
});

ipcMain.handle("open-pdf-dialog-multi", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (result.canceled || !result.filePaths.length) return [];
  return result.filePaths;
});

ipcMain.handle("get-pdf-base64", (event, examName, fileName) => {
  const filePath = path.join(getExamsDir(), examName, fileName);
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
});

ipcMain.handle(
  "rename-pdf-file",
  (event, examName, oldFileName, newFileName) => {
    const dir = path.join(getExamsDir(), examName);
    const oldPath = path.join(dir, oldFileName);
    const newPath = path.join(dir, newFileName);
    if (!fs.existsSync(oldPath)) return false;
    if (fs.existsSync(newPath)) return false; // prevent overwrite
    try {
      fs.renameSync(oldPath, newPath);
      return true;
    } catch (e) {
      console.error("Rename PDF error:", e);
      return false;
    }
  }
);

// Delete PDF file in exam folder
ipcMain.handle("delete-pdf-file", (event, examName, fileName) => {
  const filePath = path.join(getExamsDir(), examName, fileName);
  if (!fs.existsSync(filePath)) return false;
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (e) {
    console.error("Delete PDF error:", e);
    return false;
  }
});

// AutoUpdater

autoUpdater.on('update-available', () => {
  console.log('[AutoUpdater] Update available');
});
let updateDownloaded = false;
let installOnQuit = false;

// Quando l'update è scaricato, avvisa il renderer
autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] Update downloaded, waiting for user action');
  updateDownloaded = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded');
  }
});

// Ricevi la scelta dell'utente dal renderer
ipcMain.on('user-update-action', (event, action) => {
  if (action === 'install-now') {
    console.log('[AutoUpdater] User chose to install now');
    autoUpdater.quitAndInstall();
  } else if (action === 'install-on-quit') {
    console.log('[AutoUpdater] User chose to install on quit');
    installOnQuit = true;
  }
});

// Quando l'app sta per chiudersi, installa se richiesto
app.on('before-quit', (event) => {
  if (updateDownloaded && installOnQuit) {
    console.log('[AutoUpdater] Installing update on quit');
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Error:', err);
});



//App Lyfecycle

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
  createMainWindow();
 
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
