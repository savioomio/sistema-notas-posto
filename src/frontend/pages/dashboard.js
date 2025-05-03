
// src/frontend/pages/dashboard.js
const clientService = require('../services/clientService');
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openClientModal } = require('../components/client/clientModal');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');

// Carregar dashboard
async function loadDashboard() {
  try {
    // Carregar clientes com notas vencidas
    const clients = await clientService.getAllClients();
    const overdueClients = clients.filter(client => client.has_overdue);

    const overdueClientsTable = document.getElementById('overdue-clients').querySelector('tbody');
    overdueClientsTable.innerHTML = '';

    if (overdueClients.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhum cliente com notas vencidas</td>';
      overdueClientsTable.appendChild(row);
    } else {
      overdueClients.forEach(client => {
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

    // Carregar notas pendentes
    const invoices = await invoiceService.getAllInvoices();
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'pendente');

    const pendingInvoicesTable = document.getElementById('pending-invoices').querySelector('tbody');
    pendingInvoicesTable.innerHTML = '';

    if (pendingInvoices.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota pendente</td>';
      pendingInvoicesTable.appendChild(row);
    } else {
      pendingInvoices.forEach(invoice => {
        const isInvoiceOverdue = isOverdue(invoice.due_date);
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
                : 'bg-yellow-100 text-yellow-800'}">
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

    // Configurar eventos
    setupDashboardEvents();
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}
// Marcar nota como paga
async function payInvoice(invoiceId) {
  try {
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    // Atualizar status para paga
    invoice.status = 'paga';

    await invoiceService.updateInvoice(invoiceId, invoice);

    // Recarregar dashboard
    await loadDashboard();
  } catch (error) {
    console.error('Erro ao pagar nota:', error);
    alert(`Erro ao pagar nota: ${error.message}`);
  }
}

// Configurar eventos do dashboard
function setupDashboardEvents() {
  // Botões de ações nas tabelas (delegação de eventos)
  document.querySelectorAll('#overdue-clients .view-client-profile').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      window.showClientProfile(clientId);
    });
  });

  document.querySelectorAll('#overdue-clients .view-client').forEach(button => {
    button.addEventListener('click', (event) => {
      const clientId = event.target.dataset.id;
      openClientModal(clientId);
      document.querySelector('.tab[data-tab="clients"]').click();
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
  // Botões do topo
  document.getElementById('add-client-btn').addEventListener('click', () => {
    openClientModal();
  });

  document.getElementById('add-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });
}

module.exports = {
  loadDashboard,
  setupInitialDashboardEvents
};