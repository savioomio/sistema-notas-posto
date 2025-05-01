// src/backend/models/invoice.js
const { db } = require('../config/database');

// Obter todas as notas
function getAllInvoices() {
  return db.prepare(`
    SELECT i.*, c.name as client_name, c.document as client_document
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    ORDER BY i.purchase_date DESC
  `).all();
}

// Obter uma nota pelo ID
function getInvoiceById(id) {
  return db.prepare(`
    SELECT i.*, c.name as client_name, c.document as client_document
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id);
}

// Criar uma nova nota
function createInvoice(invoiceData) {
  const { client_id, purchase_date, due_date, status, total_value } = invoiceData;
  
  // Iniciar transação
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Inserir a nota
    const purchaseDate = purchase_date || new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO invoices (client_id, purchase_date, due_date, status, total_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(client_id, purchaseDate, due_date, status, total_value);
    
    const invoiceId = result.lastInsertRowid;
    
    // Finalizar transação
    db.prepare('COMMIT').run();
    
    return invoiceId;
  } catch (error) {
    // Reverter transação em caso de erro
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

// Atualizar uma nota
function updateInvoice(id, invoiceData) {
  const { client_id, purchase_date, due_date, status, total_value } = invoiceData;
  
  // Iniciar transação
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Atualizar a nota
    db.prepare(`
      UPDATE invoices 
      SET client_id = ?, purchase_date = ?, due_date = ?, status = ?, total_value = ?
      WHERE id = ?
    `).run(client_id, purchase_date, due_date, status, total_value, id);
    
    // Finalizar transação
    db.prepare('COMMIT').run();
    
    return id;
  } catch (error) {
    // Reverter transação em caso de erro
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

// Excluir uma nota
function deleteInvoice(id) {
  // Iniciar transação
  db.prepare('BEGIN TRANSACTION').run();
  
  try {    
    // Remover nota
    const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    
    // Finalizar transação
    db.prepare('COMMIT').run();
    
    return result;
  } catch (error) {
    // Reverter transação em caso de erro
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};