// src/frontend/app.js
// Aplicação principal do frontend
const { ipcRenderer } = require('electron');

// Importar serviços
const api = require('./services/api');
const authService = require('./services/authService');
const socketService = require('./services/socketService');

// Importar páginas
const dashboard = require('./pages/dashboard');
const clients = require('./pages/clients');
const invoices = require('./pages/invoices');
const settings = require('./pages/settings');
const clientProfile = require('./pages/clientProfile');

// Importar componentes
const clientModal = require('./components/client/clientModal');
const invoiceModal = require('./components/invoice/invoiceModal');

// Configurações
let config = {};

// ---------- FUNÇÕES DE NAVEGAÇÃO ----------

// Alternar entre abas
function showTab(tabId) {
  // Limpar eventos do dashboard anterior
  if (document.querySelector('.tab[data-tab="dashboard"]').classList.contains('active')) {
    const dashboard = require('./pages/dashboard');
    dashboard.cleanup();
  }

  // Remover classe active de todas as abas
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    // Remover estilo ativo
    const tabLink = tab.querySelector('a');
    tabLink.classList.remove('border-blue-500', 'text-blue-600');
    tabLink.classList.add('border-transparent');
  });

  // Adicionar classe active na aba selecionada
  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  activeTab.classList.add('active');
  
  // Adicionar estilo ativo
  const activeTabLink = activeTab.querySelector('a');
  activeTabLink.classList.remove('border-transparent');
  activeTabLink.classList.add('border-blue-500', 'text-blue-600');

  // Esconder todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });

  // Mostrar o conteúdo selecionado
  document.getElementById(tabId).classList.remove('hidden');

  // Carregar dados da aba selecionada
  if (tabId === 'dashboard') {
    dashboard.loadDashboard();
  } else if (tabId === 'clients') {
    clients.loadClients();
  } else if (tabId === 'invoices') {
    invoices.loadInvoices();
  } else if (tabId === 'settings') {
    settings.loadSettings();
  }
}

// Adicionar uma nova função para mostrar o perfil do cliente (após a função showApp)
function showClientProfile(clientId) {
  // Esconder todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Mostrar o perfil do cliente
  document.getElementById('client-profile').classList.remove('hidden');
  
  // Carregar os dados do cliente
  clientProfile.loadClientProfile(clientId);
}

// Expor a função para o escopo global (após o window.showLoginScreen)
window.showClientProfile = showClientProfile;

// Mostrar página de login ou aplicação principal
function showApp(isAuthenticated) {
  if (isAuthenticated) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Inicializar WebSocket SOMENTE após login bem-sucedido
    initWebSocket(config);
    
    // Inicialmente mostrar o dashboard
    showTab('dashboard');
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('password').value = '';
    
    // Desconectar WebSocket se existir
    socketService.disconnect();
  }
}
// Expor função para mostrar tela de login (para o logout)
window.showLoginScreen = function() {
  showApp(false);
};

// Inicializar WebSocket global
function initWebSocket(config) {
  // Verificar se estamos autenticados
  if (!localStorage.getItem('token')) {
    console.log('WebSocket: Inicialização ignorada - usuário não autenticado');
    return null;
  }

  let wsUrl;
  if (config.runServer) {
    wsUrl = `http://localhost:${config.serverPort}`;
  } else {
    wsUrl = `http://${config.serverIp}:${config.serverPort}`;
  }
  
  console.log('Inicializando WebSocket:', wsUrl);
  
  // Conectar WebSocket
  const socket = socketService.connect(wsUrl);
  
  // Só configurar handlers se a conexão for bem-sucedida
  if (socket) {
    setupGlobalWebSocketHandlers();
  }
  
  return socket;
}

// Handlers globais para eventos WebSocket
function setupGlobalWebSocketHandlers() {
  // Eventos de cliente
  socketService.on('client_created', handleGlobalClientUpdate);
  socketService.on('client_updated', handleGlobalClientUpdate);
  socketService.on('client_deleted', handleGlobalClientUpdate);
  
  // Eventos de nota
  socketService.on('invoice_created', handleGlobalInvoiceUpdate);
  socketService.on('invoice_updated', handleGlobalInvoiceUpdate);
  socketService.on('invoice_deleted', handleGlobalInvoiceUpdate);
}

// Handler para atualizações de clientes
function handleGlobalClientUpdate(data) {
  console.log('Atualização de cliente recebida via WebSocket:', data);
  
  // Identificar página ativa
  const activeTab = document.querySelector('.tab.active');
  if (!activeTab) return;
  
  const tabName = activeTab.dataset.tab;
  
  // Atualizar página atual conforme necessário
  if (tabName === 'dashboard') {
    if (typeof dashboard.loadDashboard === 'function') {
      dashboard.loadDashboard();
    }
  } 
  else if (tabName === 'clients') {
    if (typeof clients.loadClients === 'function') {
      clients.loadClients();
    }
  }
  
  // Verificar se estamos no perfil do cliente
  if (!document.getElementById('client-profile').classList.contains('hidden')) {
    const profileClientId = document.getElementById('profile-client-id').textContent;
    if (profileClientId && (data.id == profileClientId || data.client_id == profileClientId)) {
      if (typeof clientProfile.loadClientProfile === 'function') {
        clientProfile.loadClientProfile(profileClientId);
      }
    }
  }
}

// Handler para atualizações de notas
function handleGlobalInvoiceUpdate(data) {
  console.log('Atualização de nota recebida via WebSocket:', data);
  
  // Identificar página ativa
  const activeTab = document.querySelector('.tab.active');
  if (!activeTab) return;
  
  const tabName = activeTab.dataset.tab;
  
  // Atualizar página atual conforme necessário
  if (tabName === 'dashboard') {
    if (typeof dashboard.loadDashboard === 'function') {
      dashboard.loadDashboard();
    }
  } 
  else if (tabName === 'invoices') {
    if (typeof invoices.loadInvoices === 'function') {
      invoices.loadInvoices();
    }
  }
  
  // Verificar se estamos no perfil do cliente
  if (!document.getElementById('client-profile').classList.contains('hidden')) {
    const profileClientId = document.getElementById('profile-client-id').textContent;
    if (profileClientId && data.client_id == profileClientId) {
      if (typeof clientProfile.loadClientProfile === 'function') {
        clientProfile.loadClientProfile(profileClientId);
      }
    }
  }
}

// ---------- INICIALIZAÇÃO ----------

// Inicializar aplicação
async function initApp() {
  try {
    // Carregar configurações
    config = await ipcRenderer.invoke('get-config');

    // Configurar URL da API
    if (config.runServer) {
      api.setApiUrl(`http://localhost:${config.serverPort}`);
    } else {
      api.setApiUrl(`http://${config.serverIp}:${config.serverPort}`);
    }

    // Verificar autenticação
    const isAuthenticated = await authService.checkAuth();
    showApp(isAuthenticated);

    // Configurar eventos
    setupEvents();

    // Verificar status do servidor periodicamente
    setInterval(settings.updateServerStatus, 5000);
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
}

// Configurar eventos
function setupEvents() {
  // Eventos de autenticação
  document.getElementById('login-button').addEventListener('click', async () => {
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    
    if (!password) {
      const utils = require('./assets/js/utils');
      utils.showAlert('Digite a senha', 'error', loginError);
      return;
    }
    
    try {
      await authService.login(password);
      showApp(true); // Isso agora vai inicializar o WebSocket também
    } catch (error) {
      const utils = require('./assets/js/utils');
      utils.showAlert(error.message || 'Senha incorreta', 'error', loginError);
    }
  });
  
  document.getElementById('password').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      document.getElementById('login-button').click();
    }
  });

  // Eventos de navegação
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      showTab(tab.dataset.tab);
    });
  });

  // Configurar eventos das páginas
  dashboard.setupInitialDashboardEvents();
  clients.setupInitialClientsEvents();
  invoices.setupInitialInvoicesEvents();
  settings.setupInitialSettingsEvents();

  // Configurar eventos dos modais
  clientModal.setupClientModalEvents();
  invoiceModal.setupInvoiceModalEvents();

  // Receber atualizações de configuração do processo principal
  ipcRenderer.on('config-loaded', (event, newConfig) => {
    config = newConfig;
  
    // Atualizar URL da API
    if (config.runServer) {
      api.setApiUrl(`http://localhost:${config.serverPort}`);
    } else {
      api.setApiUrl(`http://${config.serverIp}:${config.serverPort}`);
    }
  
    // Reinicializar WebSocket com novas configurações
    socketService.disconnect(); // Desconectar o antigo
    initWebSocket(config);     // Conectar com novas configurações
  
    settings.updateServerStatus();
  });
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);