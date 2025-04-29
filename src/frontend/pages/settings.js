// src/frontend/pages/settings.js
const { ipcRenderer } = require('electron');
const api = require('../services/api');
const authService = require('../services/authService');
const { showAlert } = require('../assets/js/utils');

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
    alert('Erro ao carregar configurações: ' + error.message);
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

    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}

// Atualizar status do servidor
async function updateServerStatus() {
  const statusElement = document.getElementById('server-status');
  const isConnected = await api.testConnection();

  if (isConnected) {
    statusElement.textContent = 'Conectado ao servidor';
    statusElement.className = 'server-status status-connected';
  } else {
    statusElement.textContent = 'Desconectado do servidor';
    statusElement.className = 'server-status status-disconnected';
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
}

module.exports = {
  loadSettings,
  toggleServerConfig,
  saveNetworkConfig,
  updateServerStatus,
  changePassword,
  setupInitialSettingsEvents
};