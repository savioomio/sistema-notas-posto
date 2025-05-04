// src/frontend/services/clientService.js
const api = require('./api');

// Listar todos os clientes
async function getAllClients(queryParams = '') {
  const urlParams = queryParams instanceof URLSearchParams ? queryParams.toString() : queryParams;
  return api.request(`clients${urlParams ? '?' + urlParams : ''}`);
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

// Buscar clientes por termos de busca
async function searchClients(query, limit = 10) {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });
  
  return api.request(`clients/search?${params.toString()}`);
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  searchClients
};