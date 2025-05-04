// src/backend/models/invoice.js
const { db } = require('../config/database');

// Obter todas as notas
function getAllInvoices(page = 1, limit = 30, filters = {}) {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT i.*, c.name as client_name, c.document as client_document
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Aplicar filtros de status
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'pending') {
      sql += ' AND i.status = \'pendente\'';
    } else if (filters.status === 'paid') {
      sql += ' AND i.status = \'paga\'';
    } else if (filters.status === 'overdue') {
      sql += ' AND i.status = \'pendente\' AND i.due_date < ?';
      params.push(new Date().toISOString().split('T')[0]);
    }
  }

  // Ordenação
  if (filters.value === 'asc') {
    sql += ' ORDER BY i.total_value ASC';
  } else if (filters.value === 'desc') {
    sql += ' ORDER BY i.total_value DESC';
  } else if (filters.due === 'closest') {
    sql += ' ORDER BY i.due_date ASC';
  } else if (filters.due === 'furthest') {
    sql += ' ORDER BY i.due_date DESC';
  } else if (filters.purchase === 'newest') {
    sql += ' ORDER BY i.purchase_date DESC';
  } else if (filters.purchase === 'oldest') {
    sql += ' ORDER BY i.purchase_date ASC';
  } else {
    sql += ' ORDER BY i.purchase_date DESC';
  }

  // Paginação
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
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


// Adicionar nova função para contar notas
function getInvoiceCount(filters = {}) {
  let sql = 'SELECT COUNT(*) as count FROM invoices WHERE 1=1';
  const params = [];

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'pending') {
      sql += ' AND status = \'pendente\'';
    } else if (filters.status === 'paid') {
      sql += ' AND status = \'paga\'';
    } else if (filters.status === 'overdue') {
      sql += ' AND status = \'pendente\' AND due_date < ?';
      params.push(new Date().toISOString().split('T')[0]);
    }
  }

  const result = db.prepare(sql).get(...params);
  return result.count;
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
  deleteInvoice,
  getInvoiceCount // Nova função
};