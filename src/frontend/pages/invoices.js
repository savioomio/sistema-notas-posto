// src/frontend/pages/invoices.js
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');
const notification = require('../components/notification');
const confirmation = require('../components/confirmation');

// Armazenar dados para paginação
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  status: 'all',
  value: 'all',
  due: 'all',
  purchase: 'all'
};

// Mostrar indicador de carregamento
function showLoading() {
  const invoicesTable = document.getElementById('invoices-table').querySelector('tbody');
  invoicesTable.innerHTML = `
    <tr>
      <td colspan="6" class="px-6 py-8 text-sm text-gray-500 text-center">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          Carregando notas...
        </div>
      </td>
    </tr>
  `;
}

// Carregar lista de notas
async function loadInvoices(page = 1) {
  try {
    showLoading();

    currentPage = page;

    // Enviar filtros e paginação na requisição
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '30',
      ...currentFilters
    });

    const response = await invoiceService.getAllInvoices(params);

    // Renderizar notas
    renderInvoices(response.data);

    // Atualizar informações de paginação
    updatePaginationInfo(response.pagination);

    // Renderizar controles de paginação
    renderPaginationControls(response.pagination);

    // Atualizar visualmente os filtros selecionados
    highlightSelectedFilters();

    // Verificar estado dos filtros aplicados
    checkActiveFilters();

  } catch (error) {
    console.error('Erro ao carregar notas:', error);
    notification.error('Erro ao carregar notas: ' + error.message);
  }
}

// Verificar se há filtros ativos
function checkActiveFilters() {
  // Em vez de ler os radio buttons, usamos o objeto currentFilters
  const hasActiveFilters = 
    currentFilters.value !== 'all' || 
    currentFilters.due !== 'all' ||
    currentFilters.purchase !== 'all' || 
    currentFilters.status !== 'all';
  
  const activeFiltersIndicator = document.getElementById('invoice-active-filters');
  if (activeFiltersIndicator) {
    if (hasActiveFilters) {
      activeFiltersIndicator.classList.remove('hidden');
    } else {
      activeFiltersIndicator.classList.add('hidden');
    }
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
        label?.classList.add('selected');
      }
    });
  });
}

// Aplicar filtros e renderizar notas
function applyFilters() {
  // Obter valores dos filtros
  const valueFilter = document.querySelector('input[name="invoice-filter-value"]:checked').value;
  const dueFilter = document.querySelector('input[name="invoice-filter-due"]:checked').value;
  const purchaseFilter = document.querySelector('input[name="invoice-filter-purchase"]:checked').value;
  const statusFilter = document.querySelector('input[name="invoice-filter-status"]:checked').value;

  // Atualizar filtros atuais
  currentFilters = {
    status: statusFilter,
    value: valueFilter,
    due: dueFilter,
    purchase: purchaseFilter
  };

  // Verificar e atualizar o indicador
  checkActiveFilters();

  // Recarregar da página 1 com novos filtros
  loadInvoices(1);

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

  // Atualizar os valores dos filtros atuais
  currentFilters = {
    status: 'all',
    value: 'all',
    due: 'all',
    purchase: 'all'
  };

  // Verificar indicador
  checkActiveFilters();

  // Atualizar visuais
  highlightSelectedFilters();

  // Recarregar da página 1 com filtros padrão
  loadInvoices(1);
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
      let statusClass = '';
      let statusText = '';
      let paymentInfo = '';
      
      // Verificar status da nota
      if (invoice.status === 'paga') {
        // Se a nota está paga, usar status "Paga" independente da data
        statusClass = 'bg-green-100 text-green-800';
        statusText = 'Paga';
        // Adicionar tooltip para mostrar data de pagamento
        if (invoice.payment_date) {
          paymentInfo = `data-tooltip="Pago em: ${formatDate(invoice.payment_date)}"`;
        }
      } else if (invoice.status === 'pendente') {
        // Se a nota está pendente, verificar se está vencida
        const isInvoiceOverdue = isOverdue(invoice.due_date);
        if (isInvoiceOverdue) {
          statusClass = 'bg-red-100 text-red-800';
          statusText = 'Vencida';
        } else {
          statusClass = 'bg-yellow-100 text-yellow-800';
          statusText = 'Pendente';
        }
      }

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${invoice.client_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.purchase_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.due_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(invoice.total_value)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}" ${paymentInfo}>
            ${statusText}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="edit-invoice mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${invoice.id}">
            Editar
          </button>
          ${invoice.status !== 'paga' ?
          `<button class="pay-invoice mr-2 px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors" data-id="${invoice.id}">
              Pagar
            </button>` : ''}
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
  // Substituir o confirm nativo por nossa versão personalizada
  confirmation.danger('Tem certeza que deseja excluir esta nota?', async () => {
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
      notification.error('Erro ao excluir nota: ' + error.message);
    }
  });
}

// Configurar eventos da página de notas
function setupInvoicesEvents() {
  // Botões de edição (código existente)
  document.querySelectorAll('.edit-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
    });
  });

  // Botões de pagamento (novo)
  document.querySelectorAll('.pay-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      payInvoice(invoiceId);
    });
  });

  // Botões de exclusão (código existente)
  document.querySelectorAll('.delete-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      deleteInvoice(invoiceId);
    });
  });
}

// Atualizar informação de paginação
function updatePaginationInfo(pagination) {
  totalPages = pagination.totalPages;
  const info = document.getElementById('invoice-pagination-info');
  if (info) {
    info.textContent = `Página ${pagination.page} de ${pagination.totalPages} - Total: ${pagination.total} notas`;
  }
}

// Gerar números de página
function generateInvoicePageNumbers(pagination) {
  let pages = '';
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.totalPages, pagination.page + 2);

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === pagination.page;
    pages += `
      <button 
        data-action="goto"
        data-page="${i}"
        class="relative inline-flex items-center px-4 py-2 text-sm font-medium ${isActive
        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
      }">
        ${i}
      </button>
    `;
  }
  return pages;
}

// Também adicione navegação por teclado
document.addEventListener('keydown', (e) => {
  if (document.querySelector('.tab[data-tab="invoices"]').classList.contains('active')) {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      loadInvoices(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      loadInvoices(currentPage + 1);
    }
  }
});

// Copiar as funções de renderização de paginação do clients.js
function renderPaginationControls(pagination) {
  const container = document.getElementById('invoices-pagination-controls');
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
            ${generateInvoicePageNumbers(pagination)}
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

  setupInvoicePaginationEvents();
}

function setupInvoicePaginationEvents() {
  const container = document.getElementById('invoices-pagination-controls');
  if (!container) return;

  const oldHandler = container.pagination_handler;
  if (oldHandler) {
    container.removeEventListener('click', oldHandler);
  }

  const handler = (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button || button.disabled) return;

    const page = parseInt(button.dataset.page);
    if (!isNaN(page)) {
      loadInvoices(page);
    }
  };

  container.addEventListener('click', handler);
  container.pagination_handler = handler;
}

// Configurar eventos dos filtros
function setupFilterEvents() {
  // Adicionar event listeners para todos os filtros
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

  // MutationObserver para garantir que os filtros estejam visualmente corretos
  const filters = document.getElementById('invoice-filters-accordion');
  if (filters) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
          if (filters.open) {
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

  // Garantir que os filtros tenham o visual correto ao iniciar
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    highlightSelectedFilters();
  }
}

async function payInvoice(invoiceId) {

  confirmation.confirm('Deseja marcar esta nota como paga?', async () => {
    try {
      // Substituir o confirm nativo por nossa versão personalizada      // Código executado quando confirmado
      await invoiceService.payInvoice(invoiceId);

      // Recarregar notas na página atual
      await loadInvoices(currentPage);

      // Verificar se o dashboard está visível e recarregá-lo
      if (document.getElementById('dashboard').classList.contains('active')) {
        const dashboard = require('./dashboard');
        await dashboard.loadDashboard();
      }
    } catch (error) {
      console.error('Erro ao pagar nota:', error);
      notification.error(`Erro ao pagar nota: ${error.message}`);
    }
  });

}

module.exports = {
  loadInvoices,
  deleteInvoice,
  setupInvoicesEvents,
  setupInitialInvoicesEvents,
  applyFilters,
  clearFilters,
  payInvoice
};