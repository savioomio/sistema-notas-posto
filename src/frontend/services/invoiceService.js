// src/frontend/services/invoiceService.js
const api = require('./api');

// Listar todas as notas
async function getAllInvoices(queryParams = '') {
  const urlParams = queryParams instanceof URLSearchParams ? queryParams.toString() : queryParams;
  return api.request(`invoices${urlParams ? '?' + urlParams : ''}`);
}

// Obter uma nota específica
async function getInvoiceById(id) {
  return api.request(`invoices/${id}`);
}

// Criar nova nota
async function createInvoice(invoiceData) {
  return api.request('invoices', 'POST', invoiceData);
}

// Atualizar nota
async function updateInvoice(id, invoiceData) {
  return api.request(`invoices/${id}`, 'PUT', invoiceData);
}

// Excluir nota
async function deleteInvoice(id) {
  return api.request(`invoices/${id}`, 'DELETE');
}

// Obter notas por cliente ID
async function getInvoicesByClient(clientId, page = 1, limit = 30) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return api.request(`invoices/client/${clientId}?${params.toString()}`);
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClient
};