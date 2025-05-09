// src/frontend/components/layout/header.js
const { ipcRenderer } = require('electron');
const authService = require('../../services/authService');

// Função para renderizar o menu principal
function renderHeader() {
  const header = document.createElement('header');
  // Usar as classes de tema para cor de fundo e texto
  header.className = 'bg-light text-dark dark:bg-dark dark:text-light shadow-md py-2 px-4 fixed top-0 left-0 right-0 z-50 transition-colors';
  
  // Layout do cabeçalho
  header.innerHTML = `
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo à esquerda -->
      <div class="flex-shrink-0">
        <img src="./src/frontend/assets/logo/logo_gasmaster.svg" alt="GasMaster Logo" class="h-10 w-auto" id="logo-image" />
      </div>
      
      <!-- Tabs de navegação centralizadas -->
      <div class="flex-grow flex justify-center">
        <nav class="flex space-x-1">
          <div class="tab" data-tab="dashboard">
            <a class="inline-block p-3 border-b-2 border-transparent hover:bg-primary-700/10 transition-colors rounded-t-lg">
              <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Dashboard
            </a>
          </div>
          <div class="tab" data-tab="clients">
            <a class="inline-block p-3 border-b-2 border-transparent hover:bg-primary-700/10 transition-colors rounded-t-lg">
              <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Clientes
            </a>
          </div>
          <div class="tab" data-tab="invoices">
            <a class="inline-block p-3 border-b-2 border-transparent hover:bg-primary-700/10 transition-colors rounded-t-lg">
              <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Notas de Venda
            </a>
          </div>
          <div class="tab" data-tab="settings">
            <a class="inline-block p-3 border-b-2 border-transparent hover:bg-primary-700/10 transition-colors rounded-t-lg">
              <svg class="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Configurações
            </a>
          </div>
        </nav>
      </div>
      
      <!-- Botões à direita -->
      <div class="flex-shrink-0 flex items-center space-x-4">
        <!-- Seletor de tema -->
        <button id="theme-toggle" class="p-2 rounded-full bg-primary-700/10 hover:bg-primary-700/20 transition-colors">
          <!-- Ícone sol (tema claro) -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden dark:block" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <!-- Ícone lua (tema escuro) -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 block dark:hidden" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
        
        <!-- Botão de logout (visível apenas quando logado) -->
        <button id="header-logout-button" class="px-4 py-2 hidden bg-primary hover:bg-primary-600 text-light rounded-lg shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </div>
  `;
  
  return header;
}

// Função para inserir o cabeçalho na página
function setupHeader() {
  const container = document.querySelector('.container');
  
  if (!container) {
    console.error('Container não encontrado para inserir o cabeçalho');
    return;
  }
  
  // Inserir o cabeçalho antes do primeiro filho do container
  container.insertBefore(renderHeader(), container.firstChild);
  
  // Configurar alternância de tema
  setupThemeToggle();
  
  // Configurar eventos de navegação nas tabs
  setupHeaderNavigation();
  
  // Configurar outros eventos
  setupHeaderEvents();
  
  // Adicionar classe para dar espaço para o header fixo
  document.body.classList.add('pt-16');
}

// Função para alternar entre os temas claro e escuro
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (!themeToggle) return;
  
  // Verificar tema atual ou definir padrão
  const isDarkMode = localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Aplicar tema inicial
  document.documentElement.classList.toggle('dark', isDarkMode);
  
  // Configurar evento de clique para alternar tema
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// Configurar eventos de navegação das tabs
function setupHeaderNavigation() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      if (typeof window.showTab === 'function') {
        window.showTab(tabId);
      }
    });
  });
}

// Configurar outros eventos do cabeçalho
function setupHeaderEvents() {
  const logoutButton = document.getElementById('header-logout-button');
  
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      authService.logout();
      window.showLoginScreen();
    });
  }
}

// Função para atualizar visualmente a tab ativa
function updateActiveTab(tabId) {
  // Remover classe active de todas as tabs
  document.querySelectorAll('header .tab').forEach(tab => {
    const tabLink = tab.querySelector('a');
    tabLink.classList.remove('border-primary');
    tabLink.classList.remove('bg-primary-700/10');
    tabLink.classList.add('border-transparent');
  });

  // Adicionar classe active na tab selecionada
  const activeTab = document.querySelector(`header .tab[data-tab="${tabId}"]`);
  if (activeTab) {
    const activeTabLink = activeTab.querySelector('a');
    activeTabLink.classList.remove('border-transparent');
    activeTabLink.classList.add('border-primary');
    activeTabLink.classList.add('bg-primary-700/10');
  }
}

// Função para mostrar ou esconder o header com base no estado de autenticação
function updateHeaderVisibility(isAuthenticated) {
  const header = document.querySelector('header');
  if (header) {
    // Se não estiver autenticado, esconder o header
    header.classList.toggle('hidden', !isAuthenticated);
  }
  
  // Também atualizar o botão de logout
  const logoutButton = document.getElementById('header-logout-button');
  if (logoutButton) {
    logoutButton.classList.toggle('hidden', !isAuthenticated);
  }
  
  // Atualizar padding do body para compensar o header fixo
  if (isAuthenticated) {
    document.body.classList.add('pt-16');
  } else {
    document.body.classList.remove('pt-16');
  }
}

module.exports = {
  setupHeader,
  updateHeaderVisibility,
  updateActiveTab
};