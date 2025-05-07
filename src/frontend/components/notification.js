// src/frontend/components/notification.js
// Sistema de notificações personalizado

// Função para mostrar notificação na tela
function showNotification(message, type = 'info', duration = 3000) {
   // Verificar se o container já existe
   let container = document.getElementById('notification-container');
   
   // Criar container caso não exista
   if (!container) {
     container = document.createElement('div');
     container.id = 'notification-container';
     container.style.position = 'fixed';
     container.style.top = '20px';
     container.style.right = '20px';
     container.style.zIndex = '9999';
     document.body.appendChild(container);
   }
   
   // Criar elemento de notificação
   const notification = document.createElement('div');
   notification.className = `notification notification-${type}`;
   notification.innerHTML = `
     <div class="p-4 rounded-lg shadow-md mb-3 flex items-center ${getBackgroundColor(type)}">
       ${getIcon(type)}
       <span class="ml-2">${message}</span>
       <button class="ml-4 text-gray-700 hover:text-gray-900 focus:outline-none" onclick="this.parentNode.remove();">
         &times;
       </button>
     </div>
   `;
   
   // Adicionar ao container
   container.appendChild(notification);
   
   // Remover automaticamente após a duração
   setTimeout(() => {
     if (notification && notification.parentNode) {
       notification.remove();
     }
   }, duration);
   
   return notification;
 }
 
 // Obter cor de fundo com base no tipo
 function getBackgroundColor(type) {
   switch (type) {
     case 'success':
       return 'bg-green-100 text-green-800 border-l-4 border-green-500';
     case 'error':
       return 'bg-red-100 text-red-800 border-l-4 border-red-500';
     case 'warning':
       return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
     case 'info':
     default:
       return 'bg-blue-100 text-blue-700 border-l-4 border-blue-500';
   }
 }
 
 // Obter ícone com base no tipo
 function getIcon(type) {
   switch (type) {
     case 'success':
       return '<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
     case 'error':
       return '<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
     case 'warning':
       return '<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
     case 'info':
     default:
       return '<svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
   }
 }
 
 // Funções de atalho
 function success(message, duration) {
   return showNotification(message, 'success', duration);
 }
 
 function error(message, duration) {
   return showNotification(message, 'error', duration);
 }
 
 function warning(message, duration) {
   return showNotification(message, 'warning', duration);
 }
 
 function info(message, duration) {
   return showNotification(message, 'info', duration);
 }
 
 module.exports = {
   showNotification,
   success,
   error,
   warning,
   info
 };