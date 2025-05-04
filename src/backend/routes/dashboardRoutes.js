// src/backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

// Rota do dashboard
router.get('/dashboard', authenticateToken, getDashboardData);

module.exports = router;