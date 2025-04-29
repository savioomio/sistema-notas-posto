// src/backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, changePassword, checkAuth } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Rota de login
router.post('/login', login);

// Rota para alterar senha
router.put('/password', authenticateToken, changePassword);

// Rota de teste de autenticação
router.get('/auth-test', authenticateToken, checkAuth);

module.exports = router;