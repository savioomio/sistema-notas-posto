// src/frontend/pages/clients.js
const clientService = require('../services/clientService');
const { formatCurrency } = require('../assets/js/utils');
const { openClientModal } = require('../components/client/clientModal');

// Carregar lista de clientes
async function loadClients() {
  try {
    const clients = await clientService.getAllClients();

    const clientsTable = document.getElementById('clients-table').querySelector('tbody');
    clientsTable.innerHTML = '';

    if (clients.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhum cliente cadastrado</td>';
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
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Erro ao carregar clientes: ' + error.message);
  }
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

// Configurar eventos iniciais
function setupInitialClientsEvents() {
  // Botão novo cliente
  document.getElementById('new-client-btn').addEventListener('click', () => {
    openClientModal();
  });
}

module.exports = {
  loadClients,
  deleteClient,
  setupClientsEvents,
  setupInitialClientsEvents
};