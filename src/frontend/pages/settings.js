// src/frontend/pages/settings.js
const { ipcRenderer } = require('electron');
const api = require('../services/api');
const authService = require('../services/authService');
const { showAlert } = require('../assets/js/utils');
const notification = require('../components/notification');

// Função de logout
function logout() {
  // Limpar token de autenticação
  authService.logout();

  // Redirecionar para a tela de login
  // Isso deve chamar a função showApp do app.js, então vamos exportá-la
  window.showLoginScreen();
}

// Carregar configurações
async function loadSettings() {
  try {
    // Carregar configurações do servidor
    const config = await ipcRenderer.invoke('get-config');

    document.getElementById('run-server').checked = config.runServer;
    document.getElementById('server-port').value = config.serverPort;
    document.getElementById('server-ip').value = config.serverIp;

    // Mostrar ou esconder configurações baseado no modo
    toggleServerConfig();

    // Atualizar status do servidor
    await updateServerStatus();
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    notification.error('Erro ao carregar configurações: ' + error.message);
  }
}

// Alternar configurações do servidor
function toggleServerConfig() {
  const isServer = document.getElementById('run-server').checked;
  document.getElementById('server-config').classList.toggle('hidden', !isServer);
  document.getElementById('client-config').classList.toggle('hidden', isServer);
}

// Salvar configurações de rede
async function saveNetworkConfig() {
  const runServer = document.getElementById('run-server').checked;
  const serverPort = parseInt(document.getElementById('server-port').value);
  const serverIp = document.getElementById('server-ip').value;

  try {
    // Salvar configurações
    const config = await ipcRenderer.invoke('update-config', {
      runServer,
      serverPort,
      serverIp
    });

    // Atualizar URL da API
    if (runServer) {
      api.setApiUrl(`http://localhost:${serverPort}`);
    } else {
      api.setApiUrl(`http://${serverIp}:${serverPort}`);
    }

    // Atualizar status do servidor
    await updateServerStatus();

    notification.success('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    notification.error('Erro ao salvar configurações: ' + error.message);
  }
}

// Atualizar status do servidor
async function updateServerStatus() {
  const statusElement = document.getElementById('server-status');
  const isConnected = await api.testConnection();

  if (isConnected) {
    statusElement.textContent = 'Conectado ao servidor';
    statusElement.className = 'ml-3 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
  } else {
    statusElement.textContent = 'Desconectado do servidor';
    statusElement.className = 'ml-3 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
  }
}


// Alterar senha
async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageElement = document.getElementById('password-message');

  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert('Preencha todos os campos', 'error', messageElement);
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert('As senhas não conferem', 'error', messageElement);
    return;
  }

  try {
    await authService.changePassword(currentPassword, newPassword);

    // Limpar campos
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    showAlert('Senha alterada com sucesso', 'success', messageElement);
  } catch (error) {
    showAlert('Erro ao alterar senha: ' + error.message, 'error', messageElement);
  }
}

// Configurar eventos iniciais
function setupInitialSettingsEvents() {
  // Alternar configurações de servidor/cliente
  document.getElementById('run-server').addEventListener('change', toggleServerConfig);

  // Salvar configurações de rede
  document.getElementById('save-network-config').addEventListener('click', saveNetworkConfig);

  // Alterar senha
  document.getElementById('change-password').addEventListener('click', changePassword);

  // Botão de logout
  document.getElementById('logout-button').addEventListener('click', logout);
}

module.exports = {
  loadSettings,
  toggleServerConfig,
  saveNetworkConfig,
  updateServerStatus,
  changePassword,
  logout,
  setupInitialSettingsEvents
};