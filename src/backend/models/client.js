// src/backend/models/client.js
const { db } = require('../config/database');
const { removeAccents, escapeLikePattern } = require('../utils/stringUtils');

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

// Obter todos os clientes com notas vencidas em uma única consulta
function getClientsWithOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];
  
  return db.prepare(`
    SELECT DISTINCT c.id
    FROM clients c
    INNER JOIN invoices i ON c.id = i.client_id
    WHERE i.status = 'pendente' AND i.due_date < ?
  `).all(today);
}

// Função para contar clientes com filtros
function getClientCount(filters = {}) {
  let sql = 'SELECT COUNT(*) as count FROM clients WHERE 1=1';
  const params = [];

  if (filters.type && filters.type !== 'all') {
    sql += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    const today = new Date().toISOString().split('T')[0];
    if (filters.status === 'overdue') {
      // CORRIGIR: usar aspas simples em vez de aspas duplas
      sql += ' AND id IN (SELECT DISTINCT client_id FROM invoices WHERE status = \'pendente\' AND due_date < ?)';
      params.push(today);
    } else if (filters.status === 'regular') {
      // CORRIGIR: usar aspas simples em vez de aspas duplas
      sql += ' AND id NOT IN (SELECT DISTINCT client_id FROM invoices WHERE status = \'pendente\' AND due_date < ?)';
      params.push(today);
    }
  }

  const result = db.prepare(sql).get(...params);
  return result.count;
}

// Função para obter todos os clientes com paginação e filtros
function getAllClients(page = 1, limit = 50, filters = {}) {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const params = [];

  // Aplicar filtros
  if (filters.type && filters.type !== 'all') {
    sql += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    const today = new Date().toISOString().split('T')[0];
    if (filters.status === 'overdue') {
      // CORRIGIR: usar aspas simples em vez de aspas duplas
      sql += ' AND id IN (SELECT DISTINCT client_id FROM invoices WHERE status = \'pendente\' AND due_date < ?)';
      params.push(today);
    } else if (filters.status === 'regular') {
      // CORRIGIR: usar aspas simples em vez de aspas duplas
      sql += ' AND id NOT IN (SELECT DISTINCT client_id FROM invoices WHERE status = \'pendente\' AND due_date < ?)';
      params.push(today);
    }
  }

  // Ordenação
  if (filters.name) {
    if (filters.name === 'asc') {
      sql += ' ORDER BY name ASC';
    } else if (filters.name === 'desc') {
      sql += ' ORDER BY name DESC';
    }
  } else {
    sql += ' ORDER BY name';
  }

  // Paginação
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
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

// Buscar clientes: ID exato para números, nome para texto
function searchClients(query, limit = 10) {
  // Verificar se é um número (busca apenas por ID exato)
  const isNumeric = /^\d+$/.test(query);
  
  if (isNumeric) {
    // Se for número, buscar APENAS ID exato
    return db.prepare(`
      SELECT id, type, name, document, phone 
      FROM clients 
      WHERE id = ?
      LIMIT ?
    `).all(parseInt(query), limit);
    
  } else {
    // Se não for número, buscar por nome
    const normalizedQuery = removeAccents(query);
    const likePattern = `%${escapeLikePattern(normalizedQuery)}%`;
    
    // Buscar clientes e filtrar por nome normalizado no JavaScript
    const allClients = db.prepare(`
      SELECT id, type, name, document, phone 
      FROM clients 
      ORDER BY name ASC
    `).all();
    
    // Filtrar clientes onde o nome normalizado contém o termo de busca normalizado
    const filteredClients = allClients.filter(client => {
      const normalizedName = removeAccents(client.name);
      return normalizedName.includes(normalizedQuery);
    });
    
    // Limitar resultados
    return filteredClients.slice(0, limit);
  }
}

// Obter estatísticas do cliente
function getClientStatistics(clientId) {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'paga' THEN total_value ELSE 0 END) as total_paid_value,
      SUM(CASE WHEN status = 'pendente' THEN total_value ELSE 0 END) as total_pending_value,
      COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pending_count,
      MIN(purchase_date) as first_purchase_date
    FROM invoices 
    WHERE client_id = ?
  `).get(clientId);
  
  return stats;
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
  clientHasOverdueInvoices,
  getClientCount,
  searchClients,
  getClientStatistics,
  getClientsWithOverdueInvoices
};