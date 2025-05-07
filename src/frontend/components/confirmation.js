// src/frontend/components/confirmation.js
// Sistema de confirmação personalizado

/**
 * Mostra um diálogo de confirmação personalizado
 * @param {string} message - Mensagem de confirmação
 * @param {Function} onConfirm - Função a ser executada se confirmado
 * @param {Function} onCancel - Função a ser executada se cancelado
 * @param {Object} options - Opções adicionais
 */
function showConfirmation(message, onConfirm, onCancel, options = {}) {
   // Opções padrão
   const defaultOptions = {
     title: 'Confirmação',
     confirmText: 'Confirmar',
     cancelText: 'Cancelar',
     confirmClass: 'bg-blue-500 hover:bg-blue-600',
     cancelClass: 'bg-gray-300 hover:bg-gray-400',
     type: 'question' // question, warning, danger
   };
   
   // Mesclar opções padrão com as fornecidas
   const settings = { ...defaultOptions, ...options };
   
   // Evitar duplicatas, remover diálogo existente se houver
   const existingDialog = document.getElementById('custom-confirmation-dialog');
   if (existingDialog) {
     existingDialog.remove();
   }
   
   // Criar container do diálogo
   const dialog = document.createElement('div');
   dialog.id = 'custom-confirmation-dialog';
   dialog.classList.add('fixed', 'inset-0', 'flex', 'items-center', 'justify-center', 'z-50');
   
   // Overlay de fundo
   const overlay = document.createElement('div');
   overlay.classList.add('absolute', 'inset-0', 'bg-[#00000096]');
   overlay.addEventListener('click', () => {
     // Cancelar ao clicar fora do diálogo
     if (typeof onCancel === 'function') {
       onCancel();
     }
     dialog.remove();
   });
   
   // Conteúdo do diálogo
   const content = document.createElement('div');
   content.classList.add(
     'relative', 'bg-white', 'rounded-lg', 'shadow-lg', 'p-6', 
     'mx-4', 'md:mx-auto', 'w-full', 'max-w-md', 'z-10'
   );
   
   // Ícone conforme o tipo
   let iconSvg = '';
   
   switch (settings.type) {
     case 'warning':
       iconSvg = '<svg class="w-10 h-10 text-yellow-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
       break;
     case 'danger':
       iconSvg = '<svg class="w-10 h-10 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
       break;
     case 'question':
     default:
       iconSvg = '<svg class="w-10 h-10 text-blue-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>';
   }
   
   // HTML do conteúdo
   content.innerHTML = `
     <div class="text-center">
       ${iconSvg}
       <h3 class="text-lg font-medium text-gray-900 mb-2">${settings.title}</h3>
       <p class="text-sm text-gray-500 mb-5">${message}</p>
       <div class="flex justify-center space-x-4">
         <button id="confirm-dialog-cancel" class="px-4 py-2 text-sm font-medium text-gray-700 ${settings.cancelClass} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
           ${settings.cancelText}
         </button>
         <button id="confirm-dialog-confirm" class="px-4 py-2 text-sm font-medium text-white ${settings.confirmClass} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
           ${settings.confirmText}
         </button>
       </div>
     </div>
   `;
   
   // Anexar elementos ao DOM
   dialog.appendChild(overlay);
   dialog.appendChild(content);
   document.body.appendChild(dialog);
   
   // Definir foco no botão de confirmação
   setTimeout(() => {
     const confirmButton = document.getElementById('confirm-dialog-confirm');
     if (confirmButton) {
       confirmButton.focus();
     }
   }, 0);
   
   // Eventos dos botões
   document.getElementById('confirm-dialog-confirm').addEventListener('click', () => {
     dialog.remove();
     if (typeof onConfirm === 'function') {
       onConfirm();
     }
   });
   
   document.getElementById('confirm-dialog-cancel').addEventListener('click', () => {
     dialog.remove();
     if (typeof onCancel === 'function') {
       onCancel();
     }
   });
   
   // Suporte a teclas
   dialog.addEventListener('keydown', (e) => {
     // Enter confirma
     if (e.key === 'Enter') {
       e.preventDefault();
       dialog.remove();
       if (typeof onConfirm === 'function') {
         onConfirm();
       }
     }
     
     // Esc cancela
     if (e.key === 'Escape') {
       e.preventDefault();
       dialog.remove();
       if (typeof onCancel === 'function') {
         onCancel();
       }
     }
   });
   
   // Retornar elemento do diálogo
   return dialog;
 }
 
 // Funções de atalho para diferentes tipos de confirmação
 function confirm(message, onConfirm, onCancel, options = {}) {
   return showConfirmation(message, onConfirm, onCancel, { 
     type: 'question',
     ...options 
   });
 }
 
 function warning(message, onConfirm, onCancel, options = {}) {
   return showConfirmation(message, onConfirm, onCancel, { 
     type: 'warning',
     title: 'Atenção',
     ...options 
   });
 }
 
 function danger(message, onConfirm, onCancel, options = {}) {
   return showConfirmation(message, onConfirm, onCancel, { 
     type: 'danger',
     title: 'Atenção',
     confirmText: 'Excluir',
     confirmClass: 'bg-red-500 hover:bg-red-600',
     ...options 
   });
 }
 
 module.exports = {
   showConfirmation,
   confirm,
   warning,
   danger
 };