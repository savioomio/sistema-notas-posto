// src/frontend/services/invoiceService.js
const api = require('./api');

// Listar todas as notas
async function getAllInvoices() {
  return api.request('invoices');
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

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};