// src/backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  getInvoicesByClient,
  payInvoice
} = require('../controllers/invoiceController');
const { authenticateToken } = require('../middlewares/auth');

// Rotas de notas
router.get('/invoices', authenticateToken, getAllInvoices);
router.get('/invoices/:id', authenticateToken, getInvoiceById);
router.post('/invoices', authenticateToken, createInvoice);
router.put('/invoices/:id', authenticateToken, updateInvoice);
router.delete('/invoices/:id', authenticateToken, deleteInvoice);
router.get('/invoices/client/:clientId', authenticateToken, getInvoicesByClient);
router.put('/invoices/:id/pay', authenticateToken, payInvoice); 

module.exports = router;