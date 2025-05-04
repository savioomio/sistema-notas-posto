// src/backend/models/dashboard.js
const { db } = require('../config/database');

// Obter clientes com notas vencidas (com paginação)
function getOverdueClients(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().split('T')[0];
  
  const clients = db.prepare(`
    SELECT c.* FROM clients c
    WHERE c.id IN (
      SELECT DISTINCT client_id FROM invoices 
      WHERE status = 'pendente' AND due_date < ?
    )
    LIMIT ? OFFSET ?
  `).all(today, limit, offset);
  
  const total = db.prepare(`
    SELECT COUNT(DISTINCT c.id) as count FROM clients c
    WHERE c.id IN (
      SELECT DISTINCT client_id FROM invoices 
      WHERE status = 'pendente' AND due_date < ?
    )
  `).get(today).count;
  
  return {
    data: clients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// Obter notas pendentes (com paginação)
function getPendingInvoices(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name 
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.status = 'pendente'
    ORDER BY i.due_date ASC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM invoices 
    WHERE status = 'pendente'
  `).get().count;
  
  return {
    data: invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// Obter totais para dashboard
function getDashboardTotals() {
  const today = new Date().toISOString().split('T')[0];
  
  const result = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM clients) as total_clients,
      (SELECT COUNT(DISTINCT c.id) 
        FROM clients c
        WHERE c.id IN (
          SELECT DISTINCT client_id FROM invoices 
          WHERE status = 'pendente' AND due_date < ?
        )
      ) as overdue_clients,
      (SELECT COUNT(*) FROM invoices WHERE status = 'pendente') as pending_invoices,
      (SELECT COALESCE(SUM(total_value), 0) FROM invoices WHERE status = 'pendente') as pending_value,
      (SELECT COALESCE(SUM(total_value), 0) FROM invoices WHERE status = 'paga') as paid_value
  `).get(today);
  
  return result;
}

module.exports = {
  getOverdueClients,
  getPendingInvoices,
  getDashboardTotals
};