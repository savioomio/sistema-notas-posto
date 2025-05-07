// src/frontend/components/client/clientModal.js
const clientForm = require('./clientForm');
const clientService = require('../../services/clientService');
const notification = require('../../components/notification');

// Abrir modal de cliente
async function openClientModal(clientId = null) {
  const modal = document.getElementById('client-modal');
  const modalTitle = document.getElementById('client-modal-title');

  // Limpar formulário
  clientForm.clearClientForm();

  if (clientId) {
    // Modo de edição
    modalTitle.textContent = 'Editar Cliente';

    try {
      // Carregar dados do cliente
      const client = await clientService.getClientById(clientId);
      clientForm.fillClientForm(client);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      notification.error(`Erro ao carregar cliente: ${error.message}`);
      return;
    }
  } else {
    // Modo de criação
    modalTitle.textContent = 'Novo Cliente';
    
    // Inicializar com tipo PF
    clientForm.updateClientTypeUI('PF');
  }

  // Mostrar modal
  modal.classList.remove('hidden');
}

// Fechar modal de cliente
function closeClientModal() {
  document.getElementById('client-modal').classList.add('hidden');
}

// Salvar cliente
async function saveClient(event) {
  // Impedir comportamento padrão do formulário
  if (event) event.preventDefault();

  try {
    console.log('Função saveClient iniciada');

    // Validar formulário
    const validation = clientForm.validateClientForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Obter dados do formulário
    const clientData = clientForm.getClientFormData();
    console.log('Dados do cliente a serem enviados:', clientData);

    // Salvar cliente
    if (clientData.id) {
      // Atualizar cliente existente
      await clientService.updateClient(clientData.id, clientData);
      console.log(`Cliente ID ${clientData.id} atualizado com sucesso`);
    } else {
      // Criar novo cliente
      await clientService.createClient(clientData);
      console.log('Novo cliente criado com sucesso');
    }

    // Fechar modal
    closeClientModal();

    // Recarregar dados
    try {
      // Carregar clientes
      if (typeof window.loadClients === 'function') {
        await window.loadClients();
      } else {
        // Tentar importar dinamicamente para evitar dependência circular
        const clients = require('../../pages/clients');
        if (typeof clients.loadClients === 'function') {
          await clients.loadClients();
        }
      }

      // Recarregar dashboard se estiver visível
      if (document.getElementById('dashboard').classList.contains('active')) {
        try {
          if (typeof window.loadDashboard === 'function') {
            await window.loadDashboard();
          } else {
            // Tentar importar dinamicamente
            const dashboard = require('../../pages/dashboard');
            if (typeof dashboard.loadDashboard === 'function') {
              await dashboard.loadDashboard();
            }
          }
        } catch (error) {
          console.log('O dashboard não foi atualizado, mas o cliente foi salvo.', error);
        }
      }
    } catch (error) {
      console.log('A lista de clientes não foi atualizada, mas o cliente foi salvo.', error);
    }

    // Mostrar mensagem de sucesso
    notification.success('Cliente salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    notification.error(`Erro ao salvar cliente: ${error.message}`);
  }
}

// Configurar eventos do modal
function setupClientModalEvents() {
  // Botão fechar no X
  document.getElementById('close-client-modal').addEventListener('click', closeClientModal);

  // Botão cancelar
  document.getElementById('cancel-client').addEventListener('click', closeClientModal);

  // Formulário submit
  document.getElementById('client-form').addEventListener('submit', saveClient);
  
  // Configurar máscaras e validações
  clientForm.setupFormMasks();
  
  // Configurar cliques nos radio buttons
  const clientTypeOptions = document.querySelectorAll('.client-type-option');
  clientTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const radioInput = this.querySelector('input[type="radio"]');
      radioInput.checked = true;
      // Disparar o evento change para atualizar a UI
      const event = new Event('change');
      radioInput.dispatchEvent(event);
    });
  });
}

module.exports = {
  openClientModal,
  closeClientModal,
  saveClient,
  setupClientModalEvents
};