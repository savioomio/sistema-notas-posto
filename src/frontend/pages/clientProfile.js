// src/frontend/pages/clientProfile.js
const clientService = require('../services/clientService');
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');

// Variável para armazenar o ID do cliente atual
let currentClientId = null;

// Carregar perfil do cliente
async function loadClientProfile(clientId) {
  try {
    // Armazenar o ID do cliente atual
    currentClientId = clientId;
    
    // Buscar dados do cliente
    const client = await clientService.getClientById(clientId);
    
    // Carregar as informações do cliente
    document.getElementById('profile-client-name').textContent = client.name;
    document.getElementById('profile-client-type').textContent = client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica';
    document.getElementById('profile-client-document').textContent = client.document;
    document.getElementById('profile-client-phone').textContent = client.phone;
    document.getElementById('profile-client-address').textContent = client.address || 'Não informado';
    
    // Atualizar o status do cliente
    const statusElement = document.getElementById('profile-client-status');
    if (client.has_overdue) {
      statusElement.textContent = 'Com notas vencidas';
      statusElement.className = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
    } else {
      statusElement.textContent = 'Regular';
      statusElement.className = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
    }
    
    // Buscar as notas do cliente
    await loadClientInvoices(clientId);
    
    // Mostrar a página de perfil
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById('client-profile').classList.remove('hidden');
    
    // Destacar a aba ativa
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      const tabLink = tab.querySelector('a');
      tabLink.classList.remove('border-blue-500', 'text-blue-600');
      tabLink.classList.add('border-transparent');
    });
    
    // Não temos uma aba específica para o perfil, então destacamos a aba de clientes
    const clientsTab = document.querySelector('.tab[data-tab="clients"]');
    clientsTab.classList.add('active');
    const clientsTabLink = clientsTab.querySelector('a');
    clientsTabLink.classList.remove('border-transparent');
    clientsTabLink.classList.add('border-blue-500', 'text-blue-600');
    
  } catch (error) {
    console.error('Erro ao carregar perfil do cliente:', error);
    alert('Erro ao carregar perfil do cliente: ' + error.message);
  }
}

// Carregar notas do cliente
async function loadClientInvoices(clientId) {
  try {
    // Buscar todas as notas
    const allInvoices = await invoiceService.getAllInvoices();
    
    // Filtrar apenas as notas do cliente atual
    const clientInvoices = allInvoices.filter(invoice => invoice.client_id == clientId);
    
    // Renderizar as notas
    renderClientInvoices(clientInvoices);
  } catch (error) {
    console.error('Erro ao carregar notas do cliente:', error);
    alert('Erro ao carregar notas do cliente: ' + error.message);
  }
}

// Renderizar lista de notas do cliente
function renderClientInvoices(invoices) {
  const invoicesTable = document.getElementById('profile-invoices-table').querySelector('tbody');
  invoicesTable.innerHTML = '';

  if (invoices.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota encontrada para este cliente</td>';
    invoicesTable.appendChild(row);
  } else {
    invoices.forEach(invoice => {
      const isInvoiceOverdue = invoice.status === 'pendente' && isOverdue(invoice.due_date);

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
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
          <button class="view-invoice mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${invoice.id}">
            Visualizar
          </button>
          <button class="pay-invoice px-3 py-1 rounded-full ${invoice.status === 'paga' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'} transition-colors" data-id="${invoice.id}" ${invoice.status === 'paga' ? 'disabled' : ''}>
            ${invoice.status === 'paga' ? 'Paga' : 'Pagar'}
          </button>
        </td>
      `;
      invoicesTable.appendChild(row);
    });
  }

  // Configurar eventos
  setupClientProfileEvents();
}

// Voltar para a lista de clientes
function backToClientsList() {
   document.querySelector('.tab[data-tab="clients"]').click();
 }

// Marcar nota como paga
async function payInvoice(invoiceId) {
  try {
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    // Atualizar status para paga
    invoice.status = 'paga';

    await invoiceService.updateInvoice(invoiceId, invoice);

    // Recarregar notas do cliente
    await loadClientInvoices(currentClientId);
    
    // Verificar se o dashboard está visível e recarregá-lo
    if (document.getElementById('dashboard').classList.contains('active')) {
      const dashboard = require('./dashboard');
      await dashboard.loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao pagar nota:', error);
    alert(`Erro ao pagar nota: ${error.message}`);
  }
}

// Configurar eventos da página de perfil
function setupClientProfileEvents() {
  // Botão de voltar
  document.getElementById('back-to-clients').addEventListener('click', backToClientsList);
  
  // Botão de editar cliente
  document.getElementById('edit-profile-client').addEventListener('click', () => {
    const { openClientModal } = require('../components/client/clientModal');
    openClientModal(currentClientId);
  });
  
  // Botão de nova nota
  document.getElementById('new-profile-invoice').addEventListener('click', () => {
    const { openInvoiceModal } = require('../components/invoice/invoiceModal');
    // Abrir o modal passando o ID do cliente atual como cliente selecionado
    openInvoiceModal(null, currentClientId);
  });
  
  // Botões de visualizar nota
  document.querySelectorAll('.view-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
    });
  });
  
  // Botões de pagar nota
  document.querySelectorAll('.pay-invoice').forEach(button => {
    if (!button.disabled) {
      button.addEventListener('click', (event) => {
        const invoiceId = event.target.dataset.id;
        if (confirm('Deseja marcar esta nota como paga?')) {
          payInvoice(invoiceId);
        }
      });
    }
  });
}

module.exports = {
  loadClientProfile,
  backToClientsList
};