// renderer.js - Lógica da interface do usuário
const { ipcRenderer } = require('electron');

// Configurações
let apiUrl = 'http://localhost:3000';
let token = null;
let config = {};

// ---------- FUNÇÕES AUXILIARES ----------

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
  container.className = type === 'success' ? 'alert alert-success' : 'alert alert-error';
  container.classList.remove('hidden');

  // Esconder após 5 segundos
  setTimeout(() => {
    container.classList.add('hidden');
  }, 5000);
}

// Fazer requisição API
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${apiUrl}/api/${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`Fazendo requisição: ${method} ${url}`);
    console.log('Opções:', JSON.stringify(options));

    const response = await fetch(url, options);

    // Verificar status HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status}: ${errorText}`);

      try {
        // Tentar parser como JSON
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `Erro ${response.status}`);
      } catch (e) {
        // Se não for JSON, usar o texto completo
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Resposta recebida:', JSON.stringify(result).substring(0, 200) + '...');
    return result;
  } catch (error) {
    console.error('Erro na API:', error);
    // Verificar se é um erro de rede
    if (error.message === 'Failed to fetch') {
      throw new Error(`Não foi possível conectar ao servidor: ${apiUrl}. Verifique a conexão e as configurações.`);
    }
    throw error;
  }
}

// Adicione esta função para verificar a conexão e fornecer mais detalhes
async function testApiConnection() {
  try {
    console.log(`Testando conexão com: ${apiUrl}`);
    const response = await fetch(`${apiUrl}/api/clients`, {
      headers: {
        'Authorization': `Bearer ${token || 'no-token'}`
      }
    });

    console.log(`Status da resposta: ${response.status}`);

    if (response.ok) {
      console.log('Conexão com API estabelecida com sucesso');
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Erro ao conectar: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return false;
  }
}

// Modificação para updateServerStatus
async function updateServerStatus() {
  const statusElement = document.getElementById('server-status');

  const isConnected = await testApiConnection();

  if (isConnected) {
    statusElement.textContent = 'Conectado ao servidor';
    statusElement.className = 'server-status status-connected';
  } else {
    statusElement.textContent = 'Desconectado do servidor';
    statusElement.className = 'server-status status-disconnected';
  }
}

// ---------- FUNÇÕES DE NAVEGAÇÃO ----------

// Alternar entre abas
function showTab(tabId) {
  // Remover classe active de todas as abas
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Adicionar classe active na aba selecionada
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');

  // Esconder todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Mostrar o conteúdo selecionado
  document.getElementById(tabId).classList.add('active');

  // Carregar dados da aba selecionada
  if (tabId === 'dashboard') {
    loadDashboard();
  } else if (tabId === 'clients') {
    loadClients();
  } else if (tabId === 'invoices') {
    loadInvoices();
  } else if (tabId === 'settings') {
    loadSettings();
  }
}

// ---------- FUNÇÕES DE AUTENTICAÇÃO ----------

// Fazer login
async function login() {
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('login-error');

  if (!password) {
    showAlert('Digite a senha', 'error', loginError);
    return;
  }

  try {
    const result = await apiRequest('login', 'POST', { password });
    token = result.token;

    // Salvar token no localStorage
    localStorage.setItem('token', token);

    // Mostrar aplicação principal
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    // Carregar dashboard
    loadDashboard();
  } catch (error) {
    showAlert(error.message || 'Senha incorreta', 'error', loginError);
  }
}

// Verificar se já existe um token salvo
function checkAuth() {
  token = localStorage.getItem('token');

  if (token) {
    // Verificar se o token é válido fazendo uma requisição
    apiRequest('clients')
      .then(() => {
        // Token válido, mostrar aplicação
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        loadDashboard();
      })
      .catch(() => {
        // Token inválido, limpar e mostrar login
        token = null;
        localStorage.removeItem('token');
      });
  }
}

// Fazer logout
function logout() {
  token = null;
  localStorage.removeItem('token');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('password').value = '';
}

// ---------- FUNÇÕES DO DASHBOARD ----------

// Carregar dashboard
async function loadDashboard() {
  try {
    // Carregar clientes com notas vencidas
    const clients = await apiRequest('clients');
    const overdueClients = clients.filter(client => client.has_overdue);

    const overdueClientsTable = document.getElementById('overdue-clients').querySelector('tbody');
    overdueClientsTable.innerHTML = '';

    if (overdueClients.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4">Nenhum cliente com notas vencidas</td>';
      overdueClientsTable.appendChild(row);
    } else {
      overdueClients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${client.name}</td>
          <td>${client.document}</td>
          <td>${client.phone}</td>
          <td>
            <button class="view-client" data-id="${client.id}">Ver</button>
          </td>
        `;
        overdueClientsTable.appendChild(row);
      });
    }

    // Carregar notas pendentes
    const invoices = await apiRequest('invoices');
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'pendente');

    const pendingInvoicesTable = document.getElementById('pending-invoices').querySelector('tbody');
    pendingInvoicesTable.innerHTML = '';

    if (pendingInvoices.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5">Nenhuma nota pendente</td>';
      pendingInvoicesTable.appendChild(row);
    } else {
      pendingInvoices.forEach(invoice => {
        const isInvoiceOverdue = isOverdue(invoice.due_date);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${invoice.client_name}</td>
          <td>${formatDate(invoice.due_date)}</td>
          <td>${formatCurrency(invoice.total_value)}</td>
          <td>
            <span class="status-badge ${isInvoiceOverdue ? 'status-overdue' : 'status-pending'}">
              ${isInvoiceOverdue ? 'Vencida' : 'Pendente'}
            </span>
          </td>
          <td>
            <button class="view-invoice" data-id="${invoice.id}">Ver</button>
            <button class="pay-invoice" data-id="${invoice.id}">Pagar</button>
          </td>
        `;
        pendingInvoicesTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// ---------- FUNÇÕES DE CLIENTES ----------

// Carregar lista de clientes
async function loadClients() {
  try {
    const clients = await apiRequest('clients');

    const clientsTable = document.getElementById('clients-table').querySelector('tbody');
    clientsTable.innerHTML = '';

    if (clients.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6">Nenhum cliente cadastrado</td>';
      clientsTable.appendChild(row);
    } else {
      clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</td>
          <td>${client.name}</td>
          <td>${client.document}</td>
          <td>${client.phone}</td>
          <td>
            <span class="status-badge ${client.has_overdue ? 'status-overdue' : 'status-paid'}">
              ${client.has_overdue ? 'Com notas vencidas' : 'Regular'}
            </span>
          </td>
          <td>
            <button class="edit-client" data-id="${client.id}">Editar</button>
            <button class="delete-client danger" data-id="${client.id}">Excluir</button>
          </td>
        `;
        clientsTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

// Abrir modal de cliente
function openClientModal(clientId = null) {
  const modal = document.getElementById('client-modal');
  const modalTitle = document.getElementById('client-modal-title');
  const form = document.getElementById('client-form');

  // Limpar formulário
  form.reset();
  document.getElementById('client-id').value = '';

  if (clientId) {
    // Modo de edição
    modalTitle.textContent = 'Editar Cliente';

    // Carregar dados do cliente
    apiRequest(`clients/${clientId}`)
      .then(client => {
        document.getElementById('client-id').value = client.id;
        document.getElementById('client-type').value = client.type;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-document').value = client.document;
        document.getElementById('client-address').value = client.address || '';
        document.getElementById('client-phone').value = client.phone;
      })
      .catch(error => {
        console.error('Erro ao carregar cliente:', error);
      });
  } else {
    // Modo de criação
    modalTitle.textContent = 'Novo Cliente';
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

  // Capturar os valores diretamente dos elementos DOM
  try {
    console.log('Função saveClient iniciada');

    // Obter valores dos campos
    const clientId = document.getElementById('client-id').value;
    const type = document.getElementById('client-type').value;
    const name = document.getElementById('client-name').value;
    const document_value = document.getElementById('client-document').value;
    const address = document.getElementById('client-address').value;
    const phone = document.getElementById('client-phone').value;

    // Validar campos obrigatórios
    if (!name || !document_value || !phone) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!type || (type !== 'PF' && type !== 'PJ')) {
      alert('Selecione um tipo válido (PF ou PJ)');
      return;
    }

    // Construir objeto de dados
    const clientData = {
      type,
      name,
      document: document_value,
      address,
      phone
    };

    console.log('Dados do cliente a serem enviados:', clientData);

    // Definir método e endpoint
    let endpoint, method;
    if (clientId) {
      endpoint = `clients/${clientId}`;
      method = 'PUT';
      console.log(`Atualizando cliente ID ${clientId}`);
    } else {
      endpoint = 'clients';
      method = 'POST';
      console.log('Criando novo cliente');
    }

    // Fazer requisição à API
    const result = await apiRequest(endpoint, method, clientData);
    console.log('Resposta da API:', result);

    // Sucesso
    alert('Cliente salvo com sucesso!');

    // Fechar modal e recarregar dados
    closeClientModal();
    loadClients();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    alert('Erro ao salvar cliente: ' + error.message);
  }
}

// Excluir cliente
async function deleteClient(clientId) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) {
    return;
  }

  try {
    await apiRequest(`clients/${clientId}`, 'DELETE');
    loadClients();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    alert('Erro ao excluir cliente: ' + error.message);
  }
}

// ---------- FUNÇÕES DE NOTAS ----------

// Carregar lista de notas
async function loadInvoices() {
  try {
    const invoices = await apiRequest('invoices');

    const invoicesTable = document.getElementById('invoices-table').querySelector('tbody');
    invoicesTable.innerHTML = '';

    if (invoices.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6">Nenhuma nota cadastrada</td>';
      invoicesTable.appendChild(row);
    } else {
      invoices.forEach(invoice => {
        const isInvoiceOverdue = invoice.status === 'pendente' && isOverdue(invoice.due_date);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${invoice.client_name}</td>
          <td>${formatDate(invoice.purchase_date)}</td>
          <td>${formatDate(invoice.due_date)}</td>
          <td>${formatCurrency(invoice.total_value)}</td>
          <td>
            <span class="status-badge ${invoice.status === 'paga' ? 'status-paid' : (isInvoiceOverdue ? 'status-overdue' : 'status-pending')}">
              ${invoice.status === 'paga' ? 'Paga' : (isInvoiceOverdue ? 'Vencida' : 'Pendente')}
            </span>
          </td>
          <td>
            <button class="edit-invoice" data-id="${invoice.id}">Editar</button>
            <button class="delete-invoice danger" data-id="${invoice.id}">Excluir</button>
          </td>
        `;
        invoicesTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar notas:', error);
  }
}

// Abrir modal de nota
async function openInvoiceModal(invoiceId = null) {
  const modal = document.getElementById('invoice-modal');
  const modalTitle = document.getElementById('invoice-modal-title');
  const form = document.getElementById('invoice-form');
  const productsContainer = document.getElementById('products-container');

  // Limpar formulário
  form.reset();
  document.getElementById('invoice-id').value = '';
  productsContainer.innerHTML = '';

  // Carregar lista de clientes para o select
  try {
    const clients = await apiRequest('clients');
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
      const invoice = await apiRequest(`invoices/${invoiceId}`);

      document.getElementById('invoice-id').value = invoice.id;
      document.getElementById('invoice-client').value = invoice.client_id;
      document.getElementById('invoice-purchase-date').value = formatDateForInput(invoice.purchase_date);
      document.getElementById('invoice-due-date').value = formatDateForInput(invoice.due_date);
      document.getElementById('invoice-status').value = invoice.status;
      document.getElementById('invoice-total').value = invoice.total_value;

      // Adicionar produtos
      if (invoice.products && invoice.products.length > 0) {
        invoice.products.forEach(product => {
          addProductField(product.name, product.value);
        });
      } else {
        // Adicionar pelo menos um campo de produto vazio
        addProductField();
      }
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
      addProductField();
    }

    // Mostrar modal
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao abrir modal de nota:', error);
    alert('Erro ao abrir modal de nota: ' + error.message);
  }
}

// Adicionar campo de produto
function addProductField(name = '', value = '') {
  const template = document.getElementById('product-template');
  const productsContainer = document.getElementById('products-container');

  // Clonar template
  const productItem = template.content.cloneNode(true);

  // Preencher valores se fornecidos
  if (name) {
    productItem.querySelector('.product-name').value = name;
  }
  if (value) {
    productItem.querySelector('.product-value').value = value;
  }

  // Adicionar ao container
  productsContainer.appendChild(productItem);
}

// Remover campo de produto
function removeProductField(event) {
  const button = event.target;
  const productItem = button.parentElement;
  productItem.remove();
}

// Fechar modal de nota
function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.add('hidden');
}

async function saveInvoice(event) {
  // Impedir comportamento padrão do formulário
  if (event) event.preventDefault();

  try {
    console.log('Função saveInvoice iniciada');

    // Obter valores dos campos
    const invoiceId = document.getElementById('invoice-id').value;
    const clientId = document.getElementById('invoice-client').value;
    const purchaseDate = document.getElementById('invoice-purchase-date').value;
    const dueDate = document.getElementById('invoice-due-date').value;
    const status = document.getElementById('invoice-status').value;
    const totalValue = parseFloat(document.getElementById('invoice-total').value);

    // Validar campos obrigatórios
    if (!clientId) {
      alert('Selecione um cliente');
      return;
    }

    if (!dueDate) {
      alert('Informe a data de vencimento');
      return;
    }

    if (isNaN(totalValue) || totalValue <= 0) {
      alert('Informe um valor total válido');
      return;
    }

    // Coletar produtos
    const products = [];
    const productContainers = document.querySelectorAll('.product-item');

    productContainers.forEach(container => {
      const nameInput = container.querySelector('.product-name');
      const valueInput = container.querySelector('.product-value');

      if (nameInput && valueInput && nameInput.value && !isNaN(parseFloat(valueInput.value))) {
        products.push({
          name: nameInput.value,
          value: parseFloat(valueInput.value)
        });
      }
    });

    if (products.length === 0) {
      alert('Adicione pelo menos um produto');
      return;
    }

    console.log('Produtos coletados:', products);

    // Construir objeto de dados
    const invoiceData = {
      client_id: parseInt(clientId),
      purchase_date: purchaseDate,
      due_date: dueDate,
      status,
      total_value: totalValue,
      products
    };

    console.log('Dados da nota a serem enviados:', invoiceData);

    // Definir método e endpoint
    let endpoint, method;
    if (invoiceId) {
      endpoint = `invoices/${invoiceId}`;
      method = 'PUT';
      console.log(`Atualizando nota ID ${invoiceId}`);
    } else {
      endpoint = 'invoices';
      method = 'POST';
      console.log('Criando nova nota');
    }

    // Fazer requisição à API
    const result = await apiRequest(endpoint, method, invoiceData);
    console.log('Resposta da API:', result);

    // Sucesso
    alert('Nota salva com sucesso!');

    // Fechar modal e recarregar dados
    closeInvoiceModal();
    loadInvoices();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao salvar nota:', error);
    alert('Erro ao salvar nota: ' + error.message);
  }
}

// Excluir nota
async function deleteInvoice(invoiceId) {
  if (!confirm('Tem certeza que deseja excluir esta nota?')) {
    return;
  }

  try {
    await apiRequest(`invoices/${invoiceId}`, 'DELETE');
    loadInvoices();

    // Recarregar dashboard se estiver visível
    if (document.getElementById('dashboard').classList.contains('active')) {
      loadDashboard();
    }
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    alert('Erro ao excluir nota: ' + error.message);
  }
}

// Marcar nota como paga
async function payInvoice(invoiceId) {
  try {
    const invoice = await apiRequest(`invoices/${invoiceId}`);

    // Atualizar status para paga
    invoice.status = 'paga';

    await apiRequest(`invoices/${invoiceId}`, 'PUT', invoice);

    // Recarregar dashboard
    loadDashboard();
  } catch (error) {
    console.error('Erro ao pagar nota:', error);
    alert('Erro ao pagar nota: ' + error.message);
  }
}

// ---------- FUNÇÕES DE CONFIGURAÇÕES ----------

// Carregar configurações
async function loadSettings() {
  try {
    // Carregar configurações do servidor
    config = await ipcRenderer.invoke('get-config');

    document.getElementById('run-server').checked = config.runServer;
    document.getElementById('server-port').value = config.serverPort;
    document.getElementById('server-ip').value = config.serverIp;

    // Mostrar ou esconder configurações baseado no modo
    toggleServerConfig();

    // Atualizar status do servidor
    updateServerStatus();
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

// Alternar configurações do servidor
function toggleServerConfig() {
  const isServer = document.getElementById('run-server').checked;
  document.getElementById('server-config').classList.toggle('hidden', !isServer);
  document.getElementById('client-config').classList.toggle('hidden', isServer);
}

// Salvar configurações de rede
async function saveNetworkConfig() {
  const runServer = document.getElementById('run-server').checked;
  const serverPort = parseInt(document.getElementById('server-port').value);
  const serverIp = document.getElementById('server-ip').value;

  try {
    // Salvar configurações
    config = await ipcRenderer.invoke('update-config', {
      runServer,
      serverPort,
      serverIp
    });

    // Atualizar URL da API
    if (runServer) {
      apiUrl = `http://localhost:${serverPort}`;
    } else {
      apiUrl = `http://${serverIp}:${serverPort}`;
    }

    // Atualizar status do servidor
    updateServerStatus();

    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  }
}

// Verificar status do servidor
async function updateServerStatus() {
  const statusElement = document.getElementById('server-status');

  try {
    await fetch(`${apiUrl}/api/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    statusElement.textContent = 'Conectado ao servidor';
    statusElement.className = 'server-status status-connected';
  } catch (error) {
    statusElement.textContent = 'Desconectado do servidor';
    statusElement.className = 'server-status status-disconnected';
  }
}

// Alterar senha
async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageElement = document.getElementById('password-message');

  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert('Preencha todos os campos', 'error', messageElement);
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert('As senhas não conferem', 'error', messageElement);
    return;
  }

  try {
    // Verificar senha atual
    await apiRequest('login', 'POST', { password: currentPassword });

    // Alterar senha
    await apiRequest('password', 'PUT', { password: newPassword });

    // Limpar campos
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    showAlert('Senha alterada com sucesso', 'success', messageElement);
  } catch (error) {
    showAlert('Erro ao alterar senha: ' + error.message, 'error', messageElement);
  }
}

// Depurar o formulário de cliente
function debugClientForm() {
  const form = document.getElementById('client-form');

  // Adicionar log antes do envio original
  const originalSubmit = form.onsubmit;
  form.onsubmit = function (event) {
    console.log('Formulário de cliente sendo enviado');

    // Log dos dados
    const clientId = document.getElementById('client-id').value;
    const type = document.getElementById('client-type').value;
    const name = document.getElementById('client-name').value;
    const document = document.getElementById('client-document').value;
    const address = document.getElementById('client-address').value;
    const phone = document.getElementById('client-phone').value;

    console.log('Dados do cliente:', {
      id: clientId || 'novo',
      type,
      name,
      document,
      address,
      phone
    });

    // Continuar com o submit original
    return originalSubmit.call(this, event);
  };
}

// Depurar o formulário de nota
function debugInvoiceForm() {
  const form = document.getElementById('invoice-form');

  // Adicionar log antes do envio original
  const originalSubmit = form.onsubmit;
  form.onsubmit = function (event) {
    console.log('Formulário de nota sendo enviado');

    // Log dos dados
    const invoiceId = document.getElementById('invoice-id').value;
    const clientId = document.getElementById('invoice-client').value;
    const purchaseDate = document.getElementById('invoice-purchase-date').value;
    const dueDate = document.getElementById('invoice-due-date').value;
    const status = document.getElementById('invoice-status').value;
    const totalValue = document.getElementById('invoice-total').value;

    // Coletar produtos
    const productItems = document.querySelectorAll('.product-item');
    const products = Array.from(productItems).map(item => {
      return {
        name: item.querySelector('.product-name').value,
        value: item.querySelector('.product-value').value
      };
    });

    console.log('Dados da nota:', {
      id: invoiceId || 'nova',
      client_id: clientId,
      purchase_date: purchaseDate,
      due_date: dueDate,
      status,
      total_value: totalValue,
      products
    });

    // Continuar com o submit original
    return originalSubmit.call(this, event);
  };
}

// ---------- INICIALIZAÇÃO E EVENTOS ----------

// Quando a página carregar
window.addEventListener('DOMContentLoaded', async () => {
  // Carregar configurações
  config = await ipcRenderer.invoke('get-config');

  // Configurar URL da API
  if (config.runServer) {
    apiUrl = `http://localhost:${config.serverPort}`;
  } else {
    apiUrl = `http://${config.serverIp}:${config.serverPort}`;
  }

  // Verificar autenticação
  checkAuth();

  // Eventos de autenticação
  document.getElementById('login-button').addEventListener('click', login);
  document.getElementById('password').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      login();
    }
  });

  // Eventos de navegação
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      showTab(tab.dataset.tab);
    });
  });

  // Eventos do dashboard
  document.getElementById('add-client-btn').addEventListener('click', () => {
    openClientModal();
  });

  document.getElementById('add-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });

  // Eventos para botões dinâmicos no dashboard
  document.addEventListener('click', (event) => {
    // Ver cliente
    if (event.target.classList.contains('view-client')) {
      const clientId = event.target.dataset.id;
      openClientModal(clientId);
      showTab('clients');
    }

    // Ver nota
    if (event.target.classList.contains('view-invoice')) {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
      showTab('invoices');
    }

    // Pagar nota
    if (event.target.classList.contains('pay-invoice')) {
      const invoiceId = event.target.dataset.id;
      payInvoice(invoiceId);
    }
  });



  // Eventos de clientes
  document.getElementById('new-client-btn').addEventListener('click', () => {
    openClientModal();
  });

  document.getElementById('close-client-modal').addEventListener('click', closeClientModal);
  document.getElementById('cancel-client').addEventListener('click', closeClientModal);

  // Eventos para botões dinâmicos na lista de clientes
  document.addEventListener('click', (event) => {
    // Editar cliente
    if (event.target.classList.contains('edit-client')) {
      const clientId = event.target.dataset.id;
      openClientModal(clientId);
    }

    // Excluir cliente
    if (event.target.classList.contains('delete-client')) {
      const clientId = event.target.dataset.id;
      deleteClient(clientId);
    }
  });

  // Eventos de notas
  document.getElementById('new-invoice-btn').addEventListener('click', () => {
    openInvoiceModal();
  });

  document.getElementById('close-invoice-modal').addEventListener('click', closeInvoiceModal);
  document.getElementById('cancel-invoice').addEventListener('click', closeInvoiceModal);

  document.getElementById('add-product').addEventListener('click', () => {
    addProductField();
  });

  // Evento para remover produto (delegação de eventos)
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-product')) {
      removeProductField(event);
    }
  });

  // Eventos para botões dinâmicos na lista de notas
  document.addEventListener('click', (event) => {
    // Editar nota
    if (event.target.classList.contains('edit-invoice')) {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
    }

    // Excluir nota
    if (event.target.classList.contains('delete-invoice')) {
      const invoiceId = event.target.dataset.id;
      deleteInvoice(invoiceId);
    }
  });

  // Configuração de listeners através de delegação de eventos
  document.addEventListener('submit', function (event) {
    // Capturar o ID do formulário
    const formId = event.target.id;
    console.log(`Formulário ${formId} submetido via delegação de eventos`);

    // Prevenir comportamento padrão para todos os formulários
    event.preventDefault();

    // Direcionar para a função correta com base no ID
    if (formId === 'client-form') {
      console.log('Redirecionando para saveClient');
      saveClient(event);
    } else if (formId === 'invoice-form') {
      console.log('Redirecionando para saveInvoice');
      saveInvoice(event);
    }
  });

  // Listener para todos os botões que devem submeter formulários
  document.addEventListener('click', function (event) {
    // Verificar se é um botão de submit
    if (event.target.tagName === 'BUTTON' &&
      (event.target.type === 'submit' || event.target.closest('form'))) {

      console.log('Botão de submit ou dentro de form clicado');

      // Encontrar o formulário pai
      const form = event.target.closest('form');
      if (form) {
        console.log(`Tentando submeter o formulário ${form.id}`);

        // Se não for um botão de tipo cancel
        if (!event.target.classList.contains('secondary') &&
          !event.target.id.includes('cancel')) {

          console.log('Botão não é de cancelamento, disparando submit');

          // Criar e disparar evento de submit
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  });

  // Eventos de configurações
  document.getElementById('run-server').addEventListener('change', toggleServerConfig);

  document.getElementById('save-network-config').addEventListener('click', saveNetworkConfig);

  document.getElementById('change-password').addEventListener('click', changePassword);

  // Verificar status do servidor periodicamente
  setInterval(updateServerStatus, 5000);

  // Receber atualizações de configuração do processo principal
  ipcRenderer.on('config-loaded', (event, newConfig) => {
    config = newConfig;

    // Atualizar URL da API
    if (config.runServer) {
      apiUrl = `http://localhost:${config.serverPort}`;
    } else {
      apiUrl = `http://${config.serverIp}:${config.serverPort}`;
    }

    updateServerStatus();
  });
  // Limpar configurações anteriores que podem estar causando conflitos
  function clearAllEventListeners() {
    console.log('Limpando todos os listeners de eventos anteriores');

    // Remover todos os event listeners dos formulários
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
      const newClientForm = clientForm.cloneNode(true);
      clientForm.parentNode.replaceChild(newClientForm, clientForm);
    }

    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
      const newInvoiceForm = invoiceForm.cloneNode(true);
      invoiceForm.parentNode.replaceChild(newInvoiceForm, invoiceForm);
    }

    // Remover handlers de eventos de delegação
    document.removeEventListener('submit', handleFormSubmit);
    document.removeEventListener('click', handleButtonClick);
  }

  // Handler para submissão de formulários (usado na delegação de eventos)
  function handleFormSubmit(event) {
    console.log('Handler de submit acionado para:', event.target.id);

    // Prevenir comportamento padrão
    event.preventDefault();

    // Direcionar para a função apropriada
    if (event.target.id === 'client-form') {
      saveClient(event);
    } else if (event.target.id === 'invoice-form') {
      saveInvoice(event);
    }
  }

  // Handler para cliques em botões
  function handleButtonClick(event) {
    // Verificar se é um botão dentro de um formulário
    if (event.target.tagName === 'BUTTON' && event.target.type === 'submit') {
      console.log('Botão de submit clicado:', event.target);

      // Encontrar o formulário pai
      const form = event.target.closest('form');
      if (form) {
        console.log('Formulário pai encontrado:', form.id);
        event.preventDefault();

        if (form.id === 'client-form') {
          saveClient(event);
        } else if (form.id === 'invoice-form') {
          saveInvoice(event);
        }
      }
    }
  }

  // Configurar eventos limpos
  function setupCleanEvents() {
    // Limpar quaisquer listeners antigos
    clearAllEventListeners();

    console.log('Configurando novos event listeners');

    // Adicionar listeners para delegação de eventos
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleButtonClick);

    // Configurar botões de modal
    document.getElementById('close-client-modal').addEventListener('click', closeClientModal);
    document.getElementById('cancel-client').addEventListener('click', closeClientModal);

    document.getElementById('close-invoice-modal').addEventListener('click', closeInvoiceModal);
    document.getElementById('cancel-invoice').addEventListener('click', closeInvoiceModal);

    console.log('Event listeners configurados com sucesso');
  }

  // Executar a configuração limpa
  setupCleanEvents();
  debugClientForm();
  debugInvoiceForm();
});