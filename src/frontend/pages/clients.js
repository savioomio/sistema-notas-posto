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
      row.innerHTML = '<td colspan="6">Nenhum cliente cadastrado</td>';
      clientsTable.appendChild(row);
    } else {
      clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</td>
          <td>${client.name}</td>
          <td>${client.document}</td>
          <td>${client.phone}</td>
          <td>
            <span class="status-badge ${client.has_overdue ? 'status-overdue' : 'status-paid'}">
              ${client.has_overdue ? 'Com notas vencidas' : 'Regular'}
            </span>
          </td>
          <td>
            <button class="edit-client" data-id="${client.id}">Editar</button>
            <button class="delete-client danger" data-id="${client.id}">Excluir</button>
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