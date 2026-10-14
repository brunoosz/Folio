const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const CANVAS = '#f6f5f4';

// Uma única instância: abrir de novo apenas foca a janela existente.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function isExternal(url) {
  return /^(https?:|mailto:)/i.test(url);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 430,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    title: 'Folio',
    backgroundColor: CANVAS,
    show: false, // evita o "flash" branco: mostra só quando pronto
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../dist/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());

  // Links externos (ex.: console.groq.com, fontes científicas) abrem no navegador do sistema.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (isExternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
  return win;
}

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(() => {
  if (!gotLock) return; // segunda instância: só encerra, sem abrir janela
  Menu.setApplicationMenu(null);
  if (process.platform === 'win32') app.setAppUserModelId('com.folio.app');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
