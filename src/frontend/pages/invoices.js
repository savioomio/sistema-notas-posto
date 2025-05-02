// src/frontend/pages/invoices.js
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');

// Carregar lista de notas
async function loadInvoices() {
  try {
    const invoices = await invoiceService.getAllInvoices();

    const invoicesTable = document.getElementById('invoices-table').querySelector('tbody');
    invoicesTable.innerHTML = '';

    if (invoices.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota cadastrada</td>';
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
  } catch (error) {
    console.error('Erro ao carregar notas:', error);
    alert('Erro ao carregar notas: ' + error.message);
  }
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

// Configurar eventos iniciais
function setupInitialInvoicesEvents() {
  // Botão nova nota
  document.getElementById('new-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });
}

module.exports = {
  loadInvoices,
  deleteInvoice,
  setupInvoicesEvents,
  setupInitialInvoicesEvents
};