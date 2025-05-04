// src/backend/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient,
  searchClients,
  searchClientsWithFilters // Adicionar esta nova função
} = require('../controllers/clientController');
const { authenticateToken } = require('../middlewares/auth');

// Rotas de clientes
router.get('/clients', authenticateToken, getAllClients);
router.get('/clients/search', authenticateToken, searchClients);
router.get('/clients/search-with-filters', authenticateToken, searchClientsWithFilters);
router.get('/clients/:id', authenticateToken, getClientById);
router.post('/clients', authenticateToken, createClient);
router.put('/clients/:id', authenticateToken, updateClient);
router.delete('/clients/:id', authenticateToken, deleteClient);

module.exports = router;