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

// Atualizar uma nota
function updateInvoice(id, invoiceData) {
  const { client_id, purchase_date, due_date, status, total_value, payment_date } = invoiceData;
  
  // Iniciar transação
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Atualizar a nota
    let sql, params;
    
    if (payment_date !== undefined) {
      sql = `
        UPDATE invoices 
        SET client_id = ?, purchase_date = ?, due_date = ?, status = ?, total_value = ?, payment_date = ?
        WHERE id = ?
      `;
      params = [client_id, purchase_date, due_date, status, total_value, payment_date, id];
    } else {
      sql = `
        UPDATE invoices 
        SET client_id = ?, purchase_date = ?, due_date = ?, status = ?, total_value = ?
        WHERE id = ?
      `;
      params = [client_id, purchase_date, due_date, status, total_value, id];
    }
    
    db.prepare(sql).run(...params);
    
    // Finalizar transação
    db.prepare('COMMIT').run();
    
    return id;
  } catch (error) {
    // Reverter transação em caso de erro
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

// Criar uma nova nota
function createInvoice(invoiceData) {
  const { client_id, purchase_date, due_date, status, total_value, payment_date } = invoiceData;
  
  // Iniciar transação
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Inserir a nota
    const purchaseDate = purchase_date || new Date().toISOString();
    
    let sql, params;
    
    if (payment_date !== undefined) {
      sql = `
        INSERT INTO invoices (client_id, purchase_date, due_date, status, total_value, payment_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      params = [client_id, purchaseDate, due_date, status, total_value, payment_date];
    } else {
      sql = `
        INSERT INTO invoices (client_id, purchase_date, due_date, status, total_value)
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [client_id, purchaseDate, due_date, status, total_value];
    }
    
    const result = db.prepare(sql).run(...params);
    
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

// Obter notas por cliente com ordenação especial
function getInvoicesByClientId(clientId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  // Ordenação: pendentes primeiro (por data decrescente), depois pagas (por data decrescente)
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name, c.document as client_document
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.client_id = ?
    ORDER BY 
      CASE 
        WHEN i.status = 'pendente' THEN 0
        WHEN i.status = 'paga' THEN 1
        ELSE 2
      END,
      i.purchase_date DESC
    LIMIT ? OFFSET ?
  `).all(clientId, limit, offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM invoices 
    WHERE client_id = ?
  `).get(clientId).count;
  
  return {
    data: invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceCount,
  getInvoicesByClientId
};