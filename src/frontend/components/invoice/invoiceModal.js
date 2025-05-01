// src/frontend/components/invoice/invoiceModal.js
const invoiceForm = require('./invoiceForm');
const invoiceService = require('../../services/invoiceService');
const clientService = require('../../services/clientService');
const { formatDateForInput } = require('../../assets/js/utils');

// Abrir modal de nota
async function openInvoiceModal(invoiceId = null) {
  const modal = document.getElementById('invoice-modal');
  const modalTitle = document.getElementById('invoice-modal-title');

  // Limpar formulário
  invoiceForm.clearInvoiceForm();

  try {
    // Carregar lista de clientes para o select
    const clients = await clientService.getAllClients();
    const clientSelect = document.getElementById('invoice-client');
    clientSelect.innerHTML = '<option value="">Selecione o cliente</option>';

    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = `${client.name} (${client.document})`;
      clientSelect.appendChild(option);
    });

    if (invoiceId) {
      // Modo de edição
      modalTitle.textContent = 'Editar Nota de Venda';

      // Carregar dados da nota
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      invoiceForm.fillInvoiceForm(invoice);
    } else {
      // Modo de criação
      modalTitle.textContent = 'Nova Nota de Venda';

      // Definir data de compra para hoje
      const today = new Date();
      document.getElementById('invoice-purchase-date').value = formatDateForInput(today);

      // Definir data de vencimento para daqui a 30 dias
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      document.getElementById('invoice-due-date').value = formatDateForInput(dueDate);

      // Adicionar um campo de produto vazio
      invoiceForm.addProductField();
    }

    // Mostrar modal
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao abrir modal de nota:', error);
    alert(`Erro ao abrir modal de nota: ${error.message}`);
  }
}

// Fechar modal de nota
function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.add('hidden');
}

// Salvar nota
async function saveInvoice(event) {
  // Impedir comportamento padrão do formulário
  if (event) event.preventDefault();

  try {
    console.log('Função saveInvoice iniciada');

    // Validar formulário
    const validation = invoiceForm.validateInvoiceForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Obter dados do formulário
    const invoiceData = invoiceForm.getInvoiceFormData();
    console.log('Dados da nota a serem enviados:', invoiceData);

    // Salvar nota
    if (invoiceData.id) {
      // Atualizar nota existente
      await invoiceService.updateInvoice(invoiceData.id, invoiceData);
      console.log(`Nota ID ${invoiceData.id} atualizada com sucesso`);
    } else {
      // Criar nova nota
      await invoiceService.createInvoice(invoiceData);
      console.log('Nova nota criada com sucesso');
    }

    // Fechar modal
    closeInvoiceModal();

    // Recarregar dados
    try {
      // Carregar clientes
      if (typeof window.loadInvoices === 'function') {
        await window.loadInvoices();
      } else {
        // Tentar importar dinamicamente para evitar dependência circular
        const clients = require('../../pages/clients');
        if (typeof clients.loadInvoices === 'function') {
          await clients.loadInvoices();
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
    alert('Nota salva com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar nota:', error);
    alert(`Erro ao salvar nota: ${error.message}`);
  }
}

// Configurar eventos do modal
function setupInvoiceModalEvents() {
  // Botão fechar no X
  document.getElementById('close-invoice-modal').addEventListener('click', closeInvoiceModal);

  // Botão cancelar
  document.getElementById('cancel-invoice').addEventListener('click', closeInvoiceModal);

  // Botão adicionar produto
  document.getElementById('add-product').addEventListener('click', () => {
    invoiceForm.addProductField();
  });

  // Formulário submit
  document.getElementById('invoice-form').addEventListener('submit', saveInvoice);

  // Campos de produto (delegação de eventos para produtos adicionados dinamicamente)
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.classList.contains('product-value')) {
      invoiceForm.calculateTotalValue();
    }
  });
}

module.exports = {
  openInvoiceModal,
  closeInvoiceModal,
  saveInvoice,
  setupInvoiceModalEvents
};