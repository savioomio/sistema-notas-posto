// src/frontend/services/clientService.js
const api = require('./api');

// Listar todos os clientes
async function getAllClients() {
  return api.request('clients');
}

// Obter um cliente específico
async function getClientById(id) {
  return api.request(`clients/${id}`);
}

// Criar novo cliente
async function createClient(clientData) {
  return api.request('clients', 'POST', clientData);
}

// Atualizar cliente
async function updateClient(id, clientData) {
  return api.request(`clients/${id}`, 'PUT', clientData);
}

// Excluir cliente
async function deleteClient(id) {
  return api.request(`clients/${id}`, 'DELETE');
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};