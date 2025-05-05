// src/frontend/components/invoice/invoiceModal.js
const invoiceForm = require('./invoiceForm');
const invoiceService = require('../../services/invoiceService');
const clientService = require('../../services/clientService');
const { formatDateForInput } = require('../../assets/js/utils');

// Estado global para clientes selecionados
let selectedClient = null;
let isModalOpening = false;

// Abrir modal de nota
async function openInvoiceModal(invoiceId = null, preselectedClientId = null) {
  // Prevenir abertura múltipla
  if (isModalOpening) return;
  isModalOpening = true;

  try {
    const modal = document.getElementById('invoice-modal');
    const modalTitle = document.getElementById('invoice-modal-title');

    // Limpar formulário primeiro
    invoiceForm.clearInvoiceForm();
    
    // Garantir que selectedClient está null
    selectedClient = null;

    if (invoiceId) {
      // Modo de edição
      modalTitle.textContent = 'Editar Nota de Venda';

      try {
        // Carregar dados da nota
        const invoice = await invoiceService.getInvoiceById(invoiceId);
        
        // Mostrar modal ANTES de configurar tudo
        modal.classList.remove('hidden');
        
        // Pré-carregar cliente se edição
        if (invoice.client_id) {
          const client = await clientService.getClientById(invoice.client_id);
          if (client) {
            selectedClient = client;
            updateClientDisplay(client);
          }
        }
        
        invoiceForm.fillInvoiceForm(invoice);
      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        alert(`Erro ao carregar cliente: ${error.message}`);
        return;
      }
    } else {
      // Modo de criação
      modalTitle.textContent = 'Nova Nota de Venda';

      // Mostrar modal ANTES de configurar tudo
      modal.classList.remove('hidden');

      // Definir data de compra para hoje
      const today = new Date();
      document.getElementById('invoice-purchase-date').value = formatDateForInput(today);

      // Definir data de vencimento para daqui a 30 dias
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      document.getElementById('invoice-due-date').value = formatDateForInput(dueDate);

      // Se houver cliente pré-selecionado, carregar
      if (preselectedClientId) {
        try {
          const client = await clientService.getClientById(preselectedClientId);
          if (client) {
            selectedClient = client;
            updateClientDisplay(client);
          }
        } catch (error) {
          console.error('Erro ao carregar cliente:', error);
        }
      }

      // Garantir que começamos com apenas um campo de produto
      document.getElementById('products-container').innerHTML = '';
      invoiceForm.addProductField();
    }

    // Configurar sistema de busca DEPOIS de mostrar o modal
    setupClientSearch();

  } catch (error) {
    console.error('Erro ao abrir modal de nota:', error);
    alert(`Erro ao abrir modal de nota: ${error.message}`);
  } finally {
    // Liberar o flag após um pequeno delay
    setTimeout(() => {
      isModalOpening = false;
    }, 300);
  }
}

// Configurar sistema de busca de clientes
function setupClientSearch() {
  const clientSearch = document.getElementById('invoice-client-search');
  const searchResults = document.getElementById('invoice-client-search-results');
  
  // Verificar se os elementos existem
  if (!clientSearch || !searchResults) {
    console.error('Elementos de busca não encontrados');
    return;
  }
  
  let searchTimeout;

  // Estado inicial - limpo
  searchResults.innerHTML = '';
  searchResults.classList.add('hidden');
  clientSearch.value = '';

  // Atualizar valor do campo hidden
  const clientIdField = document.getElementById('invoice-client-id');
  if (clientIdField) {
    clientIdField.value = selectedClient ? selectedClient.id : '';
  }

  // Mostrar cliente selecionado se existir
  if (selectedClient) {
    updateClientDisplay(selectedClient);
  }

  // Evento de busca dinâmica
  clientSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Se pesquisa vazia, esconder resultados
    if (!query) {
      searchResults.innerHTML = '';
      searchResults.classList.add('hidden');
      return;
    }

    // Aguardar usuário parar de digitar
    searchTimeout = setTimeout(async () => {
      try {
        const clients = await clientService.searchClients(query);
        displaySearchResults(clients);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    }, 300);
  });

  // Fechar resultados ao clicar fora
  document.addEventListener('click', (e) => {
    if (!clientSearch.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });
}

// Mostrar resultados da busca
function displaySearchResults(clients) {
  const searchResults = document.getElementById('invoice-client-search-results');
  
  if (!searchResults) {
    console.error('Elemento searchResults não encontrado');
    return;
  }
  
  if (clients.length === 0) {
    searchResults.innerHTML = `
      <div class="px-4 py-3 text-sm text-gray-500">
        Nenhum cliente encontrado
      </div>
    `;
  } else {
    searchResults.innerHTML = clients
      .map(client => `
        <div class="client-option px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
             data-id="${client.id}">
          <div>
            <div class="font-medium text-gray-900">${client.name}</div>
            <div class="text-sm text-gray-500">${client.type === 'PF' ? 'CPF' : 'CNPJ'}: ${client.document}</div>
          </div>
          <div class="text-sm text-gray-600">ID: ${client.id}</div>
        </div>
      `)
      .join('');

    // Adicionar eventos de clique
    searchResults.querySelectorAll('.client-option').forEach(option => {
      option.addEventListener('click', () => {
        const clientId = option.dataset.id;
        const client = clients.find(c => c.id == clientId);
        selectClient(client);
      });
    });
  }
  
  searchResults.classList.remove('hidden');
}

// Selecionar cliente
function selectClient(client) {
  selectedClient = client;
  updateClientDisplay(client);
  
  // USAR NOVO ID
  const searchResults = document.getElementById('invoice-client-search-results');
  if (searchResults) {
    searchResults.classList.add('hidden');
  }
  
  const clientIdField = document.getElementById('invoice-client-id');
  if (clientIdField) {
    clientIdField.value = client.id;
  }
}


// Atualizar display do cliente selecionado
function updateClientDisplay(client) {
  const clientDisplay = document.getElementById('invoice-selected-client-display');
  const clientSearch = document.getElementById('invoice-client-search');
  
  if (!clientDisplay || !clientSearch) {
    console.error('Elementos clientDisplay ou clientSearch não encontrados');
    return;
  }
  
  clientDisplay.innerHTML = `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div class="font-medium text-gray-900">${client.name}</div>
        <div class="text-sm text-gray-500">${client.type === 'PF' ? 'CPF' : 'CNPJ'}: ${client.document} • ID: ${client.id}</div>
      </div>
      <button type="button" onclick="clearSelectedClient()" 
        class="ml-4 text-gray-400 hover:text-gray-500">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;
  
  clientDisplay.classList.remove('hidden');
  clientSearch.value = '';
}

// Limpar cliente selecionado
window.clearSelectedClient = function() {
  selectedClient = null;
  const clientDisplay = document.getElementById('invoice-selected-client-display');
  const clientSearch = document.getElementById('invoice-client-search');
  
  if (clientDisplay) {
    clientDisplay.classList.add('hidden');
    clientDisplay.innerHTML = '';
  }
  
  if (clientSearch) {
    clientSearch.value = '';
  }
  
  const clientIdField = document.getElementById('invoice-client-id');
  if (clientIdField) {
    clientIdField.value = '';
  }
};

// Fechar modal de nota
function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.add('hidden');
  
  // Apenas resetar estado necessário
  selectedClient = null;

  const clientDisplay = document.getElementById('invoice-selected-client-display');
  const clientSearch = document.getElementById('invoice-client-search');
  
  if (clientDisplay) {
    clientDisplay.classList.add('hidden');
    clientDisplay.innerHTML = '';
  }
  
  if (clientSearch) {
    clientSearch.value = '';
  }
  
  const searchResults = document.getElementById('invoice-client-search-results');
  if (searchResults) {
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
  }
}

// Salvar nota
async function saveInvoice(event) {
  if (event) event.preventDefault();

  try {
    // Verificar se tem cliente selecionado
    if (!selectedClient) {
      alert('Selecione um cliente');
      return;
    }

    // Validar formulário
    const validation = invoiceForm.validateInvoiceForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Obter dados do formulário
    const invoiceData = invoiceForm.getInvoiceFormData();
    
    // Adicionar ID do cliente selecionado
    invoiceData.client_id = selectedClient.id;

    // Salvar nota
    if (invoiceData.id) {
      await invoiceService.updateInvoice(invoiceData.id, invoiceData);
    } else {
      await invoiceService.createInvoice(invoiceData);
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