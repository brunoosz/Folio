const { app, BrowserWindow, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');

const CANVAS = '#f6f5f4';
const ICON = path.join(__dirname, '../dist/icon-512.png');

// Ao fechar a janela, o Folio fica na bandeja para continuar mandando lembretes.
let tray = null;
let saindo = false;
let avisouBandeja = false;

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
    icon: ICON,
    webPreferences: {
      // Timers continuam rodando com a janela oculta (lembretes de água, remédios…).
      backgroundThrottling: false,
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

  win.on('close', event => {
    if (saindo || process.platform === 'darwin') return;
    event.preventDefault();
    win.hide();
    if (tray && !avisouBandeja) {
      avisouBandeja = true;
      tray.displayBalloon?.({ title: 'Folio continua aberto', content: 'Os lembretes seguem ativos. Para sair, use o ícone na bandeja.', iconType: 'info' });
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
  return win;
}

function mostrarJanela() {
  const [win] = BrowserWindow.getAllWindows();
  if (!win) { createWindow(); return; }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function criarBandeja() {
  const imagem = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
  tray = new Tray(imagem);
  tray.setToolTip('Folio — lembretes ativos');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir o Folio', click: mostrarJanela },
    { type: 'separator' },
    { label: 'Sair', click: () => { saindo = true; app.quit(); } },
  ]));
  tray.on('click', mostrarJanela);
}

app.on('before-quit', () => { saindo = true; });

app.on('second-instance', mostrarJanela);

app.whenReady().then(() => {
  if (!gotLock) return; // segunda instância: só encerra, sem abrir janela
  Menu.setApplicationMenu(null);
  if (process.platform === 'win32') app.setAppUserModelId('com.folio.app');
  createWindow();
  criarBandeja();
});

app.on('window-all-closed', () => {
  // Com a bandeja, a janela só é ocultada; aqui chegamos apenas ao sair de verdade.
  if (process.platform !== 'darwin' && saindo) app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
