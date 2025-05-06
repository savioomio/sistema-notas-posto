// src/frontend/pages/dashboard.js
const dashboardService = require('../services/dashboardService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openClientModal } = require('../components/client/clientModal');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');
const invoiceService = require('../services/invoiceService');

// Estado da paginação
let overdueClientsPage = 1;
let pendingInvoicesPage = 1;
let isLoading = false;

// Mostrar estado de carregamento
function showLoading() {
  const overdueTable = document.getElementById('overdue-clients').querySelector('tbody');
  const pendingTable = document.getElementById('pending-invoices').querySelector('tbody');

  const loadingHtml = `
    <tr>
      <td colspan="4" class="px-6 py-8 text-sm text-gray-500 text-center">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          Carregando dados...
        </div>
      </td>
    </tr>
  `;

  overdueTable.innerHTML = loadingHtml;
  pendingTable.innerHTML = loadingHtml;
}

// Atualizar totais visuais
function updateTotals(totals) {
  document.getElementById('total-clients').textContent = totals.total_clients;
  document.getElementById('overdue-clients-count').textContent = totals.overdue_clients;
  document.getElementById('pending-invoices-count').textContent = totals.pending_invoices;
  document.getElementById('pending-value').textContent = formatCurrency(totals.pending_value);
}

// Renderizar controles de paginação
function renderPaginationControls(container, currentPage, totalPages, onPageChange) {
  container.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div class="flex justify-between flex-1">
        <button 
          onclick="${onPageChange}(${currentPage - 1})"
          ${currentPage === 1 ? 'disabled' : ''}
          class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Anterior
        </button>
        <span class="text-sm text-gray-700">
          Página ${currentPage} de ${totalPages}
        </span>
        <button 
          onclick="${onPageChange}(${currentPage + 1})"
          ${currentPage === totalPages ? 'disabled' : ''}
          class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Próximo
        </button>
      </div>
    </div>
  `;
}

// Navegar para página de clientes vencidos
window.navigateOverdueClients = function (page) {
  if (page < 1) return;
  overdueClientsPage = page;
  loadDashboard();
};

// Navegar para página de notas pendentes
window.navigatePendingInvoices = function (page) {
  if (page < 1) return;
  pendingInvoicesPage = page;
  loadDashboard();
};

// Carregar dashboard
async function loadDashboard() {
  if (isLoading) return;

  try {
    isLoading = true;
    showLoading();

    const data = await dashboardService.getDashboardData(overdueClientsPage, pendingInvoicesPage);

    // Atualizar totais
    updateTotals(data.totals);

    // Renderizar clientes com notas vencidas
    renderOverdueClients(data.overdue_clients);

    // Renderizar notas pendentes
    renderPendingInvoices(data.pending_invoices);

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    alert('Erro ao carregar dashboard: ' + error.message);
  } finally {
    isLoading = false;
  }
}

// Renderizar clientes com notas vencidas
function renderOverdueClients(result) {
  const overdueClientsTable = document.getElementById('overdue-clients').querySelector('tbody');
  overdueClientsTable.innerHTML = '';

  if (result.data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhum cliente com notas vencidas</td>';
    overdueClientsTable.appendChild(row);
  } else {
    result.data.forEach(client => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.document}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.phone}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="view-client-profile mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${client.id}">
            Ver Perfil
          </button>
        </td>
      `;
      overdueClientsTable.appendChild(row);
    });
  }

  // Renderizar paginação
  const paginationContainer = document.getElementById('overdue-clients-pagination');
  renderPaginationControls(paginationContainer, result.page, result.totalPages, 'navigateOverdueClients');
}

// Renderizar notas pendentes
function renderPendingInvoices(result) {
  const pendingInvoicesTable = document.getElementById('pending-invoices').querySelector('tbody');
  pendingInvoicesTable.innerHTML = '';

  if (result.data.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota pendente</td>';
    pendingInvoicesTable.appendChild(row);
  } else {
    result.data.forEach(invoice => {
      const isInvoiceOverdue = isOverdue(invoice.due_date);
      // Adicionar tooltip para mostrar data de pagamento
      const paymentInfo = invoice.payment_date ? `data-tooltip="Pago em: ${formatDate(invoice.payment_date)}"` : '';
      
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${invoice.client_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.due_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(invoice.total_value)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${isInvoiceOverdue
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'}" ${paymentInfo}>
            ${isInvoiceOverdue ? 'Vencida' : 'Pendente'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="view-invoice mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${invoice.id}">
            Ver
          </button>
          <button class="pay-invoice px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors" data-id="${invoice.id}">
            Pagar
          </button>
        </td>
      `;
      pendingInvoicesTable.appendChild(row);
    });
  }

  // Renderizar paginação
  const paginationContainer = document.getElementById('pending-invoices-pagination');
  renderPaginationControls(paginationContainer, result.page, result.totalPages, 'navigatePendingInvoices');

  // Configurar eventos
  setupDashboardEvents();
}

// Marcar nota como paga
async function payInvoice(invoiceId) {
  try {
    // Usar o novo endpoint para pagamento
    await invoiceService.payInvoice(invoiceId);
    // Recarregar dados
    await loadDashboard();
  } catch (error) {
    console.error('Erro ao pagar nota:', error);
    alert(`Erro ao pagar nota: ${error.message}`);
  }
}

// Configurar eventos do dashboard
function setupDashboardEvents() {
  document.querySelectorAll('#overdue-clients .view-client-profile').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      window.showClientProfile(clientId);
    });
  });

  document.querySelectorAll('#pending-invoices .view-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
      document.querySelector('.tab[data-tab="invoices"]').click();
    });
  });

  document.querySelectorAll('#pending-invoices .pay-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      if (confirm('Deseja marcar esta nota como paga?')) {
        payInvoice(invoiceId);
      }
    });
  });
}

// Configurar eventos iniciais
function setupInitialDashboardEvents() {
  document.getElementById('add-client-btn').addEventListener('click', () => {
    openClientModal();
  });

  document.getElementById('add-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });
}

// Remover eventos quando sair do dashboard
function cleanup() {
  
}

module.exports = {
  loadDashboard,
  setupInitialDashboardEvents,
  cleanup
};