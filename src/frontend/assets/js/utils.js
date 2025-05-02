// src/frontend/assets/js/utils.js
// Funções utilitárias

// Formatar data
function formatDate(dateString) {
  // Formatar data para exibição (DD/MM/YYYY)
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Formatar data para input
function formatDateForInput(dateString) {
  // Formatar data para o campo input (YYYY-MM-DD)
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Formatar moeda
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Verificar se uma data está vencida
function isOverdue(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Mostrar alerta
function showAlert(message, type, container) {
  container.textContent = message;

  if (type === 'success') {
    container.className = 'mt-3 p-3 bg-green-100 text-green-800 rounded-lg';
  } else {
    container.className = 'mt-3 p-3 bg-red-100 text-red-800 rounded-lg';
  }

  container.classList.remove('hidden');

  // Esconder após 5 segundos
  setTimeout(() => {
    container.classList.add('hidden');
  }, 5000);
}

module.exports = {
  formatDate,
  formatDateForInput,
  formatCurrency,
  isOverdue,
  showAlert
};