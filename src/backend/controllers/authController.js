// src/backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

// Login
function login(req, res) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Senha é obrigatória' });
  }
  
  const config = db.prepare('SELECT * FROM config WHERE id = 1').get();
  
  if (password === config.password) {
    // Gerar token JWT
    const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Senha incorreta' });
  }
}

// Alterar senha
function changePassword(req, res) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Nova senha é obrigatória' });
  }
  
  db.prepare('UPDATE config SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(password);
  
  res.json({ message: 'Senha atualizada com sucesso' });
}

// Verificar autenticação
function checkAuth(req, res) {
  res.json({ message: 'Autenticado com sucesso', user: req.user });
}

module.exports = {
  login,
  changePassword,
  checkAuth
};