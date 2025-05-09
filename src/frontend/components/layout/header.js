// src/frontend/components/layout/header.js
const { ipcRenderer } = require('electron');
const authService = require('../../services/authService');

// Função para renderizar o menu principal
function renderHeader() {
  const header = document.createElement('header');
  header.className = 'bg-dark text-light dark:bg-light dark:text-dark shadow-md py-2 px-4';
  
  // Layout do cabeçalho
  header.innerHTML = `
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="./src/frontend/assets/logo/logo_gasmaster.svg" alt="GasMaster Logo" class="h-10 w-auto" id="logo-image" />
      </div>
      
      <nav class="flex items-center space-x-4">
        <!-- Seletor de tema -->
        <button id="theme-toggle" class="p-2 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors">
          <!-- Ícone sol (tema claro) -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden dark:block" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <!-- Ícone lua (tema escuro) -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 block dark:hidden" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
        
        <!-- Nome do usuário logado (quando implementado) -->
        <span id="user-info" class="text-sm font-medium hidden">Olá, Admin</span>
        
        <!-- Botão de logout (visível apenas quando logado) -->
        <button id="header-logout-button" class="px-4 py-2 hidden bg-primary hover:bg-primary-600 text-light rounded-lg shadow-sm transition-colors">
          Sair
        </button>
      </nav>
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
  
  // Configurar outros eventos
  setupHeaderEvents();
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

// Função para atualizar a visibilidade dos elementos com base no estado de autenticação
function updateHeaderVisibility(isAuthenticated) {
  const logoutButton = document.getElementById('header-logout-button');
  const userInfo = document.getElementById('user-info');
  
  if (logoutButton) {
    logoutButton.classList.toggle('hidden', !isAuthenticated);
  }
  
  if (userInfo) {
    userInfo.classList.toggle('hidden', !isAuthenticated);
  }
}

module.exports = {
  setupHeader,
  updateHeaderVisibility
};