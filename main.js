// main.js - Processo principal do Electron
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Importar módulos do sistema
const { initDatabase } = require('./database');
const { startServer } = require('./server');

// Configurações
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
let config = {
  serverIp: 'localhost',
  serverPort: 3000,
  runServer: true // Por padrão, executar o servidor
};

// Carregar configurações
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

// Salvar configurações
function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

// Variáveis globais
let mainWindow;
let server = null;

// Inicializar o banco de dados
initDatabase();

// Criar janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carregar o HTML
  mainWindow.loadFile('index.html');

  // Enviar configurações para o renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('config-loaded', { 
      ...config, 
      isServer: !!server 
    });
  });

  // Remover menu padrão em produção
  if (process.env.NODE_ENV === 'production') {
    mainWindow.setMenu(null);
  }
}

// Iniciar servidor se configurado
function startServerIfNeeded() {
  if (config.runServer) {
    try {
      server = startServer(config.serverPort);
      console.log('Servidor API iniciado na porta', config.serverPort);
    } catch (error) {
      console.error('Erro ao iniciar servidor:', error);
    }
  }
}

// Inicializar app
app.whenReady().then(() => {
  loadConfig();
  startServerIfNeeded();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Eventos IPC

// Atualizar configurações
ipcMain.handle('update-config', (event, newConfig) => {
  const oldConfig = { ...config };
  config = { ...config, ...newConfig };
  saveConfig();
  
  // Se a configuração do servidor mudou, reiniciar
  if (newConfig.runServer !== undefined && newConfig.runServer !== oldConfig.runServer) {
    if (newConfig.runServer) {
      // Iniciar servidor
      if (!server) {
        server = startServer(config.serverPort);
      }
    } else {
      // Parar servidor
      if (server) {
        server.close();
        server = null;
      }
    }
  } else if (newConfig.serverPort !== undefined && 
             newConfig.serverPort !== oldConfig.serverPort && 
             newConfig.runServer) {
    // Se a porta mudou e o servidor deve estar rodando, reiniciar
    if (server) {
      server.close();
      server = startServer(newConfig.serverPort);
    }
  }
  
  return { ...config, isServer: !!server };
});

// Obter configurações
ipcMain.handle('get-config', () => {
  return { ...config, isServer: !!server };
});

// Finalizar ao fechar todas as janelas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Limpar antes de sair
app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});