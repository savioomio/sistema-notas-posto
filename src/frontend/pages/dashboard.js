
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
      row.innerHTML = '<td colspan="4">Nenhum cliente com notas vencidas</td>';
      overdueClientsTable.appendChild(row);
    } else {
      overdueClients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${client.name}</td>
          <td>${client.document}</td>
          <td>${client.phone}</td>
          <td>
            <button class="view-client" data-id="${client.id}">Ver</button>
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
      row.innerHTML = '<td colspan="5">Nenhuma nota pendente</td>';
      pendingInvoicesTable.appendChild(row);
    } else {
      pendingInvoices.forEach(invoice => {
        const isInvoiceOverdue = isOverdue(invoice.due_date);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${invoice.client_name}</td>
          <td>${formatDate(invoice.due_date)}</td>
          <td>${formatCurrency(invoice.total_value)}</td>
          <td>
            <span class="status-badge ${isInvoiceOverdue ? 'status-overdue' : 'status-pending'}">
              ${isInvoiceOverdue ? 'Vencida' : 'Pendente'}
            </span>
          </td>
          <td>
            <button class="view-invoice" data-id="${invoice.id}">Ver</button>
            <button class="pay-invoice" data-id="${invoice.id}">Pagar</button>
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