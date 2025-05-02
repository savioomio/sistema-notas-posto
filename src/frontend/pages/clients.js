// src/frontend/pages/clients.js
const clientService = require('../services/clientService');
const { formatCurrency } = require('../assets/js/utils');
const { openClientModal } = require('../components/client/clientModal');

// Armazenar clientes para filtragem
let allClients = [];

// Carregar lista de clientes
async function loadClients() {
  try {
    allClients = await clientService.getAllClients();
    
    // Aplicar filtros atuais (se houver)
    applyFilters();
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Erro ao carregar clientes: ' + error.message);
  }
}

// Verificar se há filtros ativos
function checkActiveFilters() {
  const nameFilter = document.querySelector('input[name="client-filter-name"]:checked').value;
  const typeFilter = document.querySelector('input[name="client-filter-type"]:checked').value;
  const statusFilter = document.querySelector('input[name="client-filter-status"]:checked').value;
  
  const hasActiveFilters = nameFilter !== 'none' || typeFilter !== 'all' || statusFilter !== 'all';
  
  // Mostrar indicador de filtros ativos se houver filtros
  const activeFiltersIndicator = document.getElementById('client-active-filters');
  if (hasActiveFilters) {
    activeFiltersIndicator.classList.remove('hidden');
  } else {
    activeFiltersIndicator.classList.add('hidden');
  }
  
  return hasActiveFilters;
}

// Destaca visualmente os filtros selecionados
function highlightSelectedFilters() {
  // TIPO DE PESSOA - primeiro remover a classe de todos
  document.querySelectorAll('[name="client-filter-type"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.classList.remove('selected');
    }
  });
  
  // Depois adicionar apenas ao selecionado
  const selectedType = document.querySelector('[name="client-filter-type"]:checked');
  if (selectedType) {
    const typeLabel = selectedType.closest('.filter-option');
    if (typeLabel) {
      typeLabel.classList.add('selected');
    }
  }
  
  // STATUS - primeiro remover a classe de todos
  document.querySelectorAll('[name="client-filter-status"]').forEach(radio => {
    const label = radio.closest('.filter-option');
    if (label) {
      label.classList.remove('selected');
    }
  });
  
  // Depois adicionar apenas ao selecionado
  const selectedStatus = document.querySelector('[name="client-filter-status"]:checked');
  if (selectedStatus) {
    const statusLabel = selectedStatus.closest('.filter-option');
    if (statusLabel) {
      statusLabel.classList.add('selected');
    }
  }
  
  // Ordenação por nome (já está funcionando, mantemos como está)
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
  
  // Verificar se há filtros ativos
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
  
  // Destacar filtros selecionados visualmente
  highlightSelectedFilters();
  
  // Aplicar filtros
  let filteredClients = [...allClients];
  
  // Filtrar por tipo
  if (typeFilter !== 'all') {
    filteredClients = filteredClients.filter(client => client.type === typeFilter);
  }
  
  // Filtrar por status
  if (statusFilter !== 'all') {
    if (statusFilter === 'overdue') {
      filteredClients = filteredClients.filter(client => client.has_overdue);
    } else if (statusFilter === 'regular') {
      filteredClients = filteredClients.filter(client => !client.has_overdue);
    }
  }
  
  // Ordenar por nome
  if (nameFilter === 'asc') {
    filteredClients.sort((a, b) => a.name.localeCompare(b.name));
  } else if (nameFilter === 'desc') {
    filteredClients.sort((a, b) => b.name.localeCompare(a.name));
  }
  
  // Renderizar clientes filtrados
  renderClients(filteredClients);
  
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
  
  // Aplicar filtros (agora com valores padrão)
  applyFilters();
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

// Configurar eventos dos filtros
function setupFilterEvents() {
  // Configurar cliques diretos nos labels
  setupDirectLabelClicks();
  
  // Eventos para os radios de nome (já está funcionando)
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
}

// Configurar eventos iniciais
function setupInitialClientsEvents() {
  // Botão novo cliente
  document.getElementById('new-client-btn').addEventListener('click', () => {
    openClientModal();
  });
  
  // Botão aplicar filtros
  document.getElementById('client-filter-apply').addEventListener('click', applyFilters);
  
  // Botão limpar filtros
  document.getElementById('client-filter-clear').addEventListener('click', clearFilters);
  
  // Configurar eventos dos filtros
  setupFilterEvents();
}

module.exports = {
  loadClients,
  deleteClient,
  setupClientsEvents,
  setupInitialClientsEvents,
  applyFilters,
  clearFilters
};