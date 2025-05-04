// src/backend/controllers/dashboardController.js
const DashboardModel = require('../models/dashboard');

// Obter dados do dashboard
function getDashboardData(req, res) {
  try {
    const overdueClientsPage = parseInt(req.query.overdue_page) || 1;
    const pendingInvoicesPage = parseInt(req.query.pending_page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const overdueClients = DashboardModel.getOverdueClients(overdueClientsPage, limit);
    const pendingInvoices = DashboardModel.getPendingInvoices(pendingInvoicesPage, limit);
    const totals = DashboardModel.getDashboardTotals();
    
    res.json({
      overdue_clients: overdueClients,
      pending_invoices: pendingInvoices,
      totals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDashboardData
};