// src/frontend/services/authService.js
const api = require('./api');

// Login
async function login(password) {
  const result = await api.request('login', 'POST', { password });
  api.setToken(result.token);
  return result;
}

// Logout
function logout() {
  api.setToken(null);
}

// Verificar se está autenticado
async function checkAuth() {
  // Carregar token do localStorage
  const token = api.loadToken();
  
  if (!token) {
    return false;
  }
  
  try {
    // Verificar se o token é válido
    await api.request('auth-test');
    return true;
  } catch (error) {
    api.setToken(null);
    return false;
  }
}

// Alterar senha
async function changePassword(currentPassword, newPassword) {
  // Verificar senha atual
  await api.request('login', 'POST', { password: currentPassword });
  
  // Alterar senha
  return api.request('password', 'PUT', { password: newPassword });
}

module.exports = {
  login,
  logout,
  checkAuth,
  changePassword
};