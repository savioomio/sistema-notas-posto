// src/frontend/services/dashboardService.js
const api = require('./api');

// Obter dados do dashboard
async function getDashboardData(overdueClientsPage = 1, pendingInvoicesPage = 1, limit = 10) {
  const params = new URLSearchParams({
    overdue_page: overdueClientsPage.toString(),
    pending_page: pendingInvoicesPage.toString(),
    limit: limit.toString()
  });
  
  return api.request(`dashboard?${params.toString()}`);
}

module.exports = {
  getDashboardData
};