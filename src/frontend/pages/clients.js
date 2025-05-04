// src/frontend/pages/clients.js
const clientService = require('../services/clientService');
const { formatCurrency } = require('../assets/js/utils');
const { openClientModal } = require('../components/client/clientModal');

// Armazenar clientes para filtragem
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  type: 'all',
  status: 'all',
  name: 'none'
};

function showLoading() {
  const clientsTable = document.getElementById('clients-table').querySelector('tbody');
  clientsTable.innerHTML = `
    <tr>
      <td colspan="6" class="px-6 py-8 text-sm text-gray-500 text-center">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          Carregando clientes...
        </div>
      </td>
    </tr>
  `;
}

// Carregar lista de clientes com paginação
async function loadClients(page = 1) {
  try {
    showLoading();
    
    currentPage = page;
    
    // Enviar filtros e paginação na requisição
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '30',
      ...currentFilters
    });
    
    const response = await clientService.getAllClients(params);
    
    // Renderizar clientes
    renderClients(response.data);
    
    // Atualizar informações de paginação
    updatePaginationInfo(response.pagination);
    
    // Renderizar controles de paginação
    renderPaginationControls(response.pagination);
    
    // Atualizar visualmente os filtros selecionados
    highlightSelectedFilters();
    
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Erro ao carregar clientes: ' + error.message);
  }
}

// Adicionar teclado para navegação
document.addEventListener('keydown', (e) => {
  if (document.querySelector('.tab[data-tab="clients"]').classList.contains('active')) {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      loadClients(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      loadClients(currentPage + 1);
    }
  }
});

// Atualizar informação de paginação
function updatePaginationInfo(pagination) {
  totalPages = pagination.totalPages;
  const info = document.getElementById('pagination-info');
  if (info) {
    info.textContent = `Página ${pagination.page} de ${pagination.totalPages} - Total: ${pagination.total} clientes`;
  }
}

// Configurar event listeners para paginação
function setupPaginationEvents() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  
  // Remover listeners antigos
  const oldHandler = container.pagination_handler;
  if (oldHandler) {
    container.removeEventListener('click', oldHandler);
  }
  
  // Adicionar novo handler
  const handler = (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    
    const page = parseInt(button.dataset.page);
    if (!isNaN(page)) {
      loadClients(page);
    }
  };
  
  container.addEventListener('click', handler);
  container.pagination_handler = handler;
}

// Renderizar controles de paginação
function renderPaginationControls(pagination) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  
  container.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div class="flex justify-between flex-1 sm:hidden">
        <button 
          data-action="prev"
          data-page="${pagination.page - 1}"
          ${pagination.page === 1 ? 'disabled' : ''}
          class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Anterior
        </button>
        <button 
          data-action="next"
          data-page="${pagination.page + 1}"
          ${pagination.page === pagination.totalPages ? 'disabled' : ''}
          class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Próximo
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando <span class="font-medium">${((pagination.page - 1) * pagination.limit) + 1}</span> a 
            <span class="font-medium">${Math.min(pagination.page * pagination.limit, pagination.total)}</span> de 
            <span class="font-medium">${pagination.total}</span> resultados
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <button 
              data-action="prev"
              data-page="${pagination.page - 1}"
              ${pagination.page === 1 ? 'disabled' : ''}
              class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
              <span class="sr-only">Anterior</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            ${generatePageNumbers(pagination)}
            <button 
              data-action="next"
              data-page="${pagination.page + 1}"
              ${pagination.page === pagination.totalPages ? 'disabled' : ''}
              class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
              <span class="sr-only">Próximo</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `;
  
  // Adicionar event listeners para os botões de paginação
  setupPaginationEvents();
}

// Gerar números de página
function generatePageNumbers(pagination) {
  let pages = '';
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.totalPages, pagination.page + 2);

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === pagination.page;
    pages += `
      <button 
        data-action="goto"
        data-page="${i}"
        class="relative inline-flex items-center px-4 py-2 text-sm font-medium ${
          isActive 
            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
        }">
        ${i}
      </button>
    `;
  }
  return pages;
}

// Verificar se há filtros ativos
function checkActiveFilters() {
  const valueFilter = document.querySelector('input[name="client-filter-name"]:checked')?.value || 'none';
  const typeFilter = document.querySelector('input[name="client-filter-type"]:checked')?.value || 'all';
  const statusFilter = document.querySelector('input[name="client-filter-status"]:checked')?.value || 'all';
  
  const hasActiveFilters = valueFilter !== 'none' || typeFilter !== 'all' || statusFilter !== 'all';
  
  const activeFiltersIndicator = document.getElementById('client-active-filters');
  if (activeFiltersIndicator) {
    if (hasActiveFilters) {
      activeFiltersIndicator.classList.remove('hidden');
    } else {
      activeFiltersIndicator.classList.add('hidden');
    }
  }
  
  return hasActiveFilters;
}

// Destaca visualmente os filtros selecionados
function highlightSelectedFilters() {
  // TIPO DE PESSOA
  document.querySelectorAll('[name="client-filter-type"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.classList.remove('selected');
    }
  });
  
  const selectedType = document.querySelector('[name="client-filter-type"]:checked');
  if (selectedType) {
    const typeLabel = selectedType.closest('.filter-option');
    if (typeLabel) {
      typeLabel.classList.add('selected');
    }
  }
  
  // STATUS
  document.querySelectorAll('[name="client-filter-status"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.classList.remove('selected');
    }
  });
  
  const selectedStatus = document.querySelector('[name="client-filter-status"]:checked');
  if (selectedStatus) {
    const statusLabel = selectedStatus.closest('.filter-option');
    if (statusLabel) {
      statusLabel.classList.add('selected');
    }
  }
  
  // ORDENAÇÃO POR NOME
  document.querySelectorAll('[name="client-filter-name"]').forEach(radio => {
    const label = radio.closest('label');
    if (label) {
      if (radio.checked && radio.value !== 'none') {
        label.classList.add('font-medium', 'text-blue-700');
      } else {
        label.classList.remove('font-medium', 'text-blue-700');
      }
    }
  });
  
  // Verificar se há filtros ativos e atualizar indicador
  checkActiveFilters();
}

// Adicionar esta nova função para tratar o clique diretamente no label
function setupDirectLabelClicks() {
  // Para tipo de pessoa
  document.querySelectorAll('[name="client-filter-type"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.addEventListener('click', function(event) {
        // Marcar este radio
        radio.checked = true;
        
        // Atualizar visualmente todos os filtros
        highlightSelectedFilters();
      });
    }
  });
  
  // Para status
  document.querySelectorAll('[name="client-filter-status"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.addEventListener('click', function(event) {
        // Marcar este radio
        radio.checked = true;
        
        // Atualizar visualmente todos os filtros
        highlightSelectedFilters();
      });
    }
  });
}

// Aplicar filtros e renderizar clientes
function applyFilters() {
  // Obter valores dos filtros
  const nameFilter = document.querySelector('input[name="client-filter-name"]:checked').value;
  const typeFilter = document.querySelector('input[name="client-filter-type"]:checked').value;
  const statusFilter = document.querySelector('input[name="client-filter-status"]:checked').value;
  
  // Atualizar filtros atuais
  currentFilters = {
    type: typeFilter,
    status: statusFilter,
    name: nameFilter
  };
  
  // Recarregar da página 1 com novos filtros
  loadClients(1);
  
  // Fechar o acordeão após aplicar filtros
  if (document.getElementById('client-filters-accordion').open) {
    document.getElementById('client-filters-accordion').open = false;
  }
}

// Limpar todos os filtros
function clearFilters() {
  // Resetar filtros para valores padrão
  document.querySelector('input[name="client-filter-name"][value="none"]').checked = true;
  document.querySelector('input[name="client-filter-type"][value="all"]').checked = true;
  document.querySelector('input[name="client-filter-status"][value="all"]').checked = true;
  
  // Atualizar os valores dos filtros atuais
  currentFilters = {
    type: 'all',
    status: 'all',
    name: 'none'
  };
  
  // Atualizar visuais
  highlightSelectedFilters();
  
  // Recarregar da página 1 com filtros padrão
  loadClients(1);
}

// Renderizar lista de clientes
function renderClients(clients) {
  const clientsTable = document.getElementById('clients-table').querySelector('tbody');
  clientsTable.innerHTML = '';

  if (clients.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhum cliente encontrado</td>';
    clientsTable.appendChild(row);
  } else {
    clients.forEach(client => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.document}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.phone}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.has_overdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
            ${client.has_overdue ? 'Com notas vencidas' : 'Regular'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="view-client-profile mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${client.id}">
            Ver Perfil
          </button>
          <button class="edit-client mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${client.id}">
            Editar
          </button>
          <button class="delete-client px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors" data-id="${client.id}">
            Excluir
          </button>
        </td>
      `;
      clientsTable.appendChild(row);
    });
  }

  // Configurar eventos
  setupClientsEvents();
}

// Excluir cliente
async function deleteClient(clientId) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) {
    return;
  }

  try {
    await clientService.deleteClient(clientId);
    await loadClients();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      const dashboard = require('./dashboard');
      await dashboard.loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    alert('Erro ao excluir cliente: ' + error.message);
  }
}

// Configurar eventos da página de clientes
function setupClientsEvents() {
  // Botões de visualizar perfil
  document.querySelectorAll('.view-client-profile').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      window.showClientProfile(clientId);
    });
  });

  // Botões de edição
  document.querySelectorAll('.edit-client').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      openClientModal(clientId);
    });
  });

  // Botões de exclusão
  document.querySelectorAll('.delete-client').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      deleteClient(clientId);
    });
  });
}


function setupFilterVisuals() {
  const filters = document.getElementById('client-filters-accordion');
  
  if (filters) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
          if (filters.open) {
            // Dar um pequeno delay para garantir que o DOM esteja renderizado
            setTimeout(() => {
              highlightSelectedFilters();
            }, 10);
          }
        }
      });
    });
    
    observer.observe(filters, { attributes: true });
  }
}

// Configurar eventos dos filtros
function setupFilterEvents() {
  // Configurar cliques diretos nos labels
  setupDirectLabelClicks();
  
  // Eventos para os radios de nome
  document.querySelectorAll('[name="client-filter-name"]').forEach(radio => {
    radio.addEventListener('change', () => {
      highlightSelectedFilters();
    });
  });
  
  // Evento para fechar o acordeão quando clicar fora dele
  document.addEventListener('click', (event) => {
    const filters = document.getElementById('client-filters-accordion');
    const clickedOutside = !filters.contains(event.target) && 
                           !event.target.closest('#client-filter-apply') && 
                           !event.target.closest('#client-filter-clear');
    
    if (filters.open && clickedOutside) {
      filters.open = false;
    }
  });
  
  // Configurar observador para visuais
  setupFilterVisuals();
}

function setupInitialClientsEvents() {
  try {
    // Botão novo cliente
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
      newClientBtn.addEventListener('click', () => {
        openClientModal();
      });
    }
    
    // Botão aplicar filtros
    const clientFilterApplyBtn = document.getElementById('client-filter-apply');
    if (clientFilterApplyBtn) {
      clientFilterApplyBtn.addEventListener('click', applyFilters);
    }
    
    // Botão limpar filtros
    const clientFilterClearBtn = document.getElementById('client-filter-clear');
    if (clientFilterClearBtn) {
      clientFilterClearBtn.addEventListener('click', clearFilters);
    }
    
    // Configurar eventos dos filtros apenas se houver elementos filter-option
    const filterOptions = document.querySelectorAll('.filter-option');
    if (filterOptions.length > 0) {
      setupFilterEvents();
    }

    // Garantir que os filtros tenham o visual correto ao iniciar
    document.addEventListener('DOMContentLoaded', () => {
      highlightSelectedFilters();
    });
    
    // Se a página já estiver carregada
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      highlightSelectedFilters();
    }
    
    // Configurar eventos de paginação
    setupPaginationEvents();
  } catch (error) {
    console.error('Erro ao configurar eventos iniciais dos clientes:', error);
  }
}

module.exports = {
  loadClients,
  deleteClient,
  setupClientsEvents,
  setupInitialClientsEvents,
  applyFilters,
  clearFilters,
  renderClients,
  renderPaginationControls,
  highlightSelectedFilters
};