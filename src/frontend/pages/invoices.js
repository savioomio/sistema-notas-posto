// src/frontend/pages/invoices.js
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');

// Armazenar notas para filtragem
let allInvoices = [];

// Carregar lista de notas
async function loadInvoices() {
  try {
    allInvoices = await invoiceService.getAllInvoices();
    
    // Aplicar filtros atuais (se houver)
    applyFilters();
  } catch (error) {
    console.error('Erro ao carregar notas:', error);
    alert('Erro ao carregar notas: ' + error.message);
  }
}

// Verificar se há filtros ativos
function checkActiveFilters() {
  const valueFilter = document.querySelector('input[name="invoice-filter-value"]:checked').value;
  const dueFilter = document.querySelector('input[name="invoice-filter-due"]:checked').value;
  const purchaseFilter = document.querySelector('input[name="invoice-filter-purchase"]:checked').value;
  const statusFilter = document.querySelector('input[name="invoice-filter-status"]:checked').value;
  
  const hasActiveFilters = valueFilter !== 'all' || dueFilter !== 'all' || 
                           purchaseFilter !== 'all' || statusFilter !== 'all';
  
  // Mostrar indicador de filtros ativos se houver filtros
  const activeFiltersIndicator = document.getElementById('invoice-active-filters');
  if (hasActiveFilters) {
    activeFiltersIndicator.classList.remove('hidden');
  } else {
    activeFiltersIndicator.classList.add('hidden');
  }
  
  return hasActiveFilters;
}

// Destacar visualmente os filtros selecionados
function highlightSelectedFilters() {
  // Resetar todas as seleções primeiro
  document.querySelectorAll('.filter-option').forEach(label => {
    label.classList.remove('selected');
  });
  
  // Para cada grupo de filtros, destacar o selecionado
  ['value', 'due', 'purchase', 'status'].forEach(filterType => {
    document.querySelectorAll(`[name="invoice-filter-${filterType}"]`).forEach(radio => {
      if (radio.checked) {
        const label = radio.closest('.filter-option');
        label.classList.add('selected');
      }
    });
  });
  
  // Verificar se há filtros ativos
  checkActiveFilters();
}

// Aplicar filtros e renderizar notas
function applyFilters() {
  // Obter valores dos filtros
  const valueFilter = document.querySelector('input[name="invoice-filter-value"]:checked').value;
  const dueFilter = document.querySelector('input[name="invoice-filter-due"]:checked').value;
  const purchaseFilter = document.querySelector('input[name="invoice-filter-purchase"]:checked').value;
  const statusFilter = document.querySelector('input[name="invoice-filter-status"]:checked').value;
  
  // Destacar filtros selecionados visualmente
  highlightSelectedFilters();
  
  // Aplicar filtros
  let filteredInvoices = [...allInvoices];
  
  // Filtrar por status
  if (statusFilter !== 'all') {
    if (statusFilter === 'paid') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === 'paga');
    } else if (statusFilter === 'pending') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === 'pendente' && !isOverdue(invoice.due_date));
    } else if (statusFilter === 'overdue') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === 'pendente' && isOverdue(invoice.due_date));
    }
  }
  
  // Aplicar ordenação
  
  // Por valor
  if (valueFilter === 'asc') {
    filteredInvoices.sort((a, b) => a.total_value - b.total_value);
  } else if (valueFilter === 'desc') {
    filteredInvoices.sort((a, b) => b.total_value - a.total_value);
  }
  
  // Por data de vencimento (sobrescreve ordenação por valor se ambos forem aplicados)
  if (dueFilter === 'closest') {
    filteredInvoices.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  } else if (dueFilter === 'furthest') {
    filteredInvoices.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  }
  
  // Por data de compra (sobrescreve ordenações anteriores se aplicado)
  if (purchaseFilter === 'newest') {
    filteredInvoices.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
  } else if (purchaseFilter === 'oldest') {
    filteredInvoices.sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
  }
  
  // Renderizar notas filtradas
  renderInvoices(filteredInvoices);
  
  // Fechar o acordeão após aplicar filtros
  if (document.getElementById('invoice-filters-accordion').open) {
    document.getElementById('invoice-filters-accordion').open = false;
  }
}

// Limpar todos os filtros
function clearFilters() {
  // Resetar filtros para valores padrão
  document.querySelector('input[name="invoice-filter-value"][value="all"]').checked = true;
  document.querySelector('input[name="invoice-filter-due"][value="all"]').checked = true;
  document.querySelector('input[name="invoice-filter-purchase"][value="all"]').checked = true;
  document.querySelector('input[name="invoice-filter-status"][value="all"]').checked = true;
  
  // Aplicar filtros (agora com valores padrão)
  applyFilters();
}

// Renderizar lista de notas
function renderInvoices(invoices) {
  const invoicesTable = document.getElementById('invoices-table').querySelector('tbody');
  invoicesTable.innerHTML = '';

  if (invoices.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota encontrada</td>';
    invoicesTable.appendChild(row);
  } else {
    invoices.forEach(invoice => {
      const isInvoiceOverdue = invoice.status === 'pendente' && isOverdue(invoice.due_date);

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${invoice.client_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.purchase_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.due_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(invoice.total_value)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${invoice.status === 'paga' 
              ? 'bg-green-100 text-green-800' 
              : (isInvoiceOverdue 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800')}">
            ${invoice.status === 'paga' ? 'Paga' : (isInvoiceOverdue ? 'Vencida' : 'Pendente')}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="edit-invoice mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${invoice.id}">
            Editar
          </button>
          <button class="delete-invoice px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors" data-id="${invoice.id}">
            Excluir
          </button>
        </td>
      `;
      invoicesTable.appendChild(row);
    });
  }

  // Configurar eventos
  setupInvoicesEvents();
}

// Excluir nota
async function deleteInvoice(invoiceId) {
  if (!confirm('Tem certeza que deseja excluir esta nota?')) {
    return;
  }

  try {
    await invoiceService.deleteInvoice(invoiceId);
    await loadInvoices();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      const dashboard = require('./dashboard');
      await dashboard.loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    alert('Erro ao excluir nota: ' + error.message);
  }
}

// Configurar eventos da página de notas
function setupInvoicesEvents() {
  // Botões de edição
  document.querySelectorAll('.edit-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
    });
  });

  // Botões de exclusão
  document.querySelectorAll('.delete-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      deleteInvoice(invoiceId);
    });
  });
}

// Configurar eventos dos filtros
function setupFilterEvents() {
  // Eventos para destacar visualmente as opções selecionadas
  document.querySelectorAll('.filter-option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      highlightSelectedFilters();
    });
  });
  
  // Evento para fechar o acordeão quando clicar fora dele
  document.addEventListener('click', (event) => {
    const filters = document.getElementById('invoice-filters-accordion');
    const clickedOutside = !filters.contains(event.target) && 
                           !event.target.closest('#invoice-filter-apply') && 
                           !event.target.closest('#invoice-filter-clear');
    
    if (filters.open && clickedOutside) {
      filters.open = false;
    }
  });
}

// Configurar eventos iniciais
function setupInitialInvoicesEvents() {
  // Botão nova nota
  document.getElementById('new-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });
  
  // Botão aplicar filtros
  document.getElementById('invoice-filter-apply').addEventListener('click', applyFilters);
  
  // Botão limpar filtros
  document.getElementById('invoice-filter-clear').addEventListener('click', clearFilters);
  
  // Configurar eventos dos filtros
  setupFilterEvents();
}

module.exports = {
  loadInvoices,
  deleteInvoice,
  setupInvoicesEvents,
  setupInitialInvoicesEvents,
  applyFilters,
  clearFilters
};