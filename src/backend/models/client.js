// src/backend/models/client.js
const { db } = require('../config/database');

// Função para verificar se um cliente tem notas vencidas
function clientHasOverdueInvoices(clientId) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM invoices 
    WHERE client_id = ? 
      AND status = 'pendente' 
      AND due_date < ?
  `).get(clientId, today);
  
  return result.count > 0;
}

// Obter todos os clientes
function getAllClients() {
  return db.prepare('SELECT * FROM clients ORDER BY name').all();
}

// Obter um cliente pelo ID
function getClientById(id) {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

// Criar um novo cliente
function createClient(clientData) {
  const { type, name, document, address, phone } = clientData;
  
  const result = db.prepare(
    'INSERT INTO clients (type, name, document, address, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(type, name, document, address || '', phone);
  
  return getClientById(result.lastInsertRowid);
}

// Atualizar um cliente
function updateClient(id, clientData) {
  const { type, name, document, address, phone } = clientData;
  
  db.prepare(`
    UPDATE clients 
    SET type = ?, name = ?, document = ?, address = ?, phone = ? 
    WHERE id = ?
  `).run(type, name, document, address || '', phone, id);
  
  return getClientById(id);
}

// Excluir um cliente
function deleteClient(id) {
  return db.prepare('DELETE FROM clients WHERE id = ?').run(id);
}

// Verificar se existe cliente com o documento
function getClientByDocument(document) {
  return db.prepare('SELECT id FROM clients WHERE document = ?').get(document);
}

// Verificar se existe outro cliente com o documento
function getOtherClientByDocument(document, id) {
  return db.prepare('SELECT id FROM clients WHERE document = ? AND id != ?').get(document, id);
}

// Verificar se cliente tem notas
function clientHasInvoices(clientId) {
  const result = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?').get(clientId);
  return result.count > 0;
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientByDocument,
  getOtherClientByDocument,
  clientHasInvoices,
  clientHasOverdueInvoices
};