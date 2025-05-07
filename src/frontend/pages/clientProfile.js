// src/frontend/pages/clientProfile.js
const clientService = require('../services/clientService');
const invoiceService = require('../services/invoiceService');
const { formatDate, formatCurrency, isOverdue } = require('../assets/js/utils');
const { openInvoiceModal } = require('../components/invoice/invoiceModal');
const notification = require('../components/notification');
const confirmation = require('../components/confirmation');

// Variável para armazenar o ID do cliente atual
let currentClientId = null;
let currentInvoicePage = 1;
let totalInvoicePages = 1;

// Carregar perfil do cliente
async function loadClientProfile(clientId) {
  try {
    // Resetar página ao mudar de cliente
    currentInvoicePage = 1;

    // Armazenar o ID do cliente atual
    currentClientId = clientId;

    // Buscar dados do cliente
    const client = await clientService.getClientById(clientId);

    // Carregar informações do cliente
    document.getElementById('profile-client-name').textContent = client.name;
    document.getElementById('profile-client-type').textContent = client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica';
    document.getElementById('profile-client-document').textContent = client.document;

    // Atualizar telefone com link para WhatsApp
    const phoneElement = document.getElementById('profile-client-phone');
    const phoneFormatted = client.phone.replace(/\D/g, ''); // Remove caracteres especiais
    phoneElement.innerHTML = `<a href="https://wa.me/55${phoneFormatted}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">${client.phone}</a>`;

    document.getElementById('profile-client-address').textContent = client.address || 'Não informado';

    // Adicionar ID e data de cadastro
    document.getElementById('profile-client-id').textContent = client.id;
    document.getElementById('profile-client-created').textContent = formatDate(client.created_at);

    // Exibir estatísticas
    const stats = client.statistics;
    document.getElementById('total-paid-value').textContent = formatCurrency(stats.total_paid_value || 0);
    document.getElementById('total-pending-value').textContent = formatCurrency(stats.total_pending_value || 0);
    document.getElementById('pending-count').textContent = stats.pending_count || 0;

    // Status
    const statusElement = document.getElementById('profile-client-status');
    if (client.has_overdue) {
      statusElement.textContent = 'Com notas vencidas';
      statusElement.className = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800';
    } else {
      statusElement.textContent = 'Regular';
      statusElement.className = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800';
    }

    // Buscar as notas do cliente
    await loadClientInvoices(clientId, currentInvoicePage);

    // Mostrar a página de perfil
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById('client-profile').classList.remove('hidden');

    // Destacar a aba ativa
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      const tabLink = tab.querySelector('a');
      tabLink.classList.remove('border-blue-500', 'text-blue-600');
      tabLink.classList.add('border-transparent');
    });

    const clientsTab = document.querySelector('.tab[data-tab="clients"]');
    clientsTab.classList.add('active');
    const clientsTabLink = clientsTab.querySelector('a');
    clientsTabLink.classList.remove('border-transparent');
    clientsTabLink.classList.add('border-blue-500', 'text-blue-600');

  } catch (error) {
    console.error('Erro ao carregar perfil do cliente:', error);
    notification.error('Erro ao carregar perfil do cliente: ' + error.message);
  }
}

// Adicionar função para gerar PDF
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  try {
    // Buscar dados do cliente
    const client = await clientService.getClientById(currentClientId);
    const stats = client.statistics;

    // Buscar notas
    const response = await invoiceService.getInvoicesByClient(currentClientId);
    const invoices = response.data;

    // Configurar documento
    doc.setFont('helvetica');

    // Adicionar logo
    try {
      const { ipcRenderer } = require('electron');
      const logoBase64 = await ipcRenderer.invoke('read-image', 'src/frontend/assets/logo/logo_licinio.png');

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 10, 10, 40, 20);
      } else {
        console.warn('Não foi possível carregar o logo');
      }
    } catch (error) {
      console.warn('Erro ao processar logo:', error);
    }
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Sistema do Auto Posto Licínio', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Relatório de Cliente', 105, 30, { align: 'center' });

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(10, 35, 200, 35);

    // Dados do Cliente
    let yPos = 45;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Cliente', 10, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 8;
    doc.text(`ID: ${client.id}`, 10, yPos);
    yPos += 7;
    doc.text(`Nome: ${client.name}`, 10, yPos);
    yPos += 7;
    doc.text(`Tipo: ${client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}`, 10, yPos);
    yPos += 7;
    doc.text(`Documento: ${client.document}`, 10, yPos);
    yPos += 7;
    doc.text(`Telefone: ${client.phone}`, 10, yPos);
    yPos += 7;
    doc.text(`Endereço: ${client.address || 'Não informado'}`, 10, yPos);
    yPos += 7;
    doc.text(`Data de Cadastro: ${formatDate(client.created_at)}`, 10, yPos);

    // Estatísticas
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 10, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 8;
    doc.text(`Valor Total Pago: ${formatCurrency(stats.total_paid_value || 0)}`, 10, yPos);
    yPos += 7;
    doc.text(`Valor Total Pendente: ${formatCurrency(stats.total_pending_value || 0)}`, 10, yPos);
    yPos += 7;
    doc.text(`Quantidade de Notas Pendentes: ${stats.pending_count || 0}`, 10, yPos);

    // Extrato de Notas
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Extrato de Notas', 10, yPos);

    // Para cada nota, buscar os produtos
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];

      // Obter detalhes completos da nota incluindo produtos
      const invoiceDetails = await invoiceService.getInvoiceById(invoice.id);
      invoices[i].products = invoiceDetails.products || [];
    }

    // Contador de páginas para o rodapé
    let pageCount = 1;

    // Iterar sobre as notas
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];

      // Verificar se precisamos de uma nova página
      if (yPos > 240) {
        doc.addPage();
        pageCount++;
        yPos = 20;
      }

      // Título da nota
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Nota #${invoice.id}`, 10, yPos);

      // Detalhes da nota
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPos += 7;
      doc.text(`Data de Compra: ${formatDate(invoice.purchase_date)}`, 15, yPos);
      yPos += 5;
      doc.text(`Data de Vencimento: ${formatDate(invoice.due_date)}`, 15, yPos);
      yPos += 5;

      // Status da nota e data de pagamento, se paga
      if (invoice.status === 'paga') {
        doc.setTextColor(0, 128, 0); // Verde
        doc.text(`Status: Paga`, 15, yPos);
        yPos += 5;
        if (invoice.payment_date) {
          doc.text(`Data de Pagamento: ${formatDate(invoice.payment_date)}`, 15, yPos);
          yPos += 5;
        }
      } else if (invoice.status === 'pendente' && isOverdue(invoice.due_date)) {
        doc.setTextColor(255, 0, 0); // Vermelho
        doc.text(`Status: Vencida`, 15, yPos);
        yPos += 5;
      } else {
        doc.setTextColor(255, 165, 0); // Laranja
        doc.text(`Status: Pendente`, 15, yPos);
        yPos += 5;
      }

      doc.setTextColor(0, 0, 0); // Preto
      doc.text(`Valor Total: ${formatCurrency(invoice.total_value)}`, 15, yPos);

      // Produtos da nota
      if (invoice.products && invoice.products.length > 0) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text(`Produtos:`, 15, yPos);
        doc.setFont('helvetica', 'normal');

        // Cabeçalho da tabela de produtos
        yPos += 5;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos - 4, 170, 6, 'F');
        doc.text(`Nome`, 25, yPos);
        doc.text(`Valor`, 150, yPos);

        // Listar produtos
        for (const product of invoice.products) {
          yPos += 6;

          // Verificar se precisamos de uma nova página
          if (yPos > 280) {
            doc.addPage();
            pageCount++;
            yPos = 20;
          }

          doc.text(`${product.name}`, 25, yPos);
          doc.text(`${formatCurrency(product.value)}`, 150, yPos);
        }
      }

      // Adicionar linha separadora entre notas
      yPos += 7;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(10, yPos, 200, yPos);
    }

    // Rodapé
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(new Date().toLocaleString(), 10, 290);
      doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
    }

    // Salvar PDF
    doc.save(`Relatorio_Cliente_${client.id}_${client.name.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    notification.error('Erro ao gerar relatório: ' + error.message);
  }
}

// Carregar notas do cliente com paginação
async function loadClientInvoices(clientId, page = 1) {
  try {
    currentInvoicePage = page;

    // Usa o novo endpoint específico para buscar notas por cliente com paginação
    const response = await invoiceService.getInvoicesByClient(clientId, page, 10);

    // Atualiza as variáveis de paginação
    totalInvoicePages = response.totalPages;

    // Agora temos apenas as notas do cliente específico
    const clientInvoices = response.data;

    // Renderizar as notas
    renderClientInvoices(clientInvoices, response);
  } catch (error) {
    console.error('Erro ao carregar notas do cliente:', error);
    alert('Erro ao carregar notas do cliente: ' + error.message);
  }
}

// Renderizar lista de notas do cliente com controles de paginação
function renderClientInvoices(invoices, pagination) {
  const table = document.getElementById('profile-invoices-table');
  const invoicesTable = table.querySelector('tbody');
  invoicesTable.innerHTML = '';

  if (invoices.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" class="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma nota encontrada para este cliente</td>';
    invoicesTable.appendChild(row);
  } else {
    invoices.forEach(invoice => {
      const isInvoiceOverdue = invoice.status === 'pendente' && isOverdue(invoice.due_date);
      // Adicionar tooltip para mostrar data de pagamento
      const paymentInfo = invoice.payment_date ? `data-tooltip="Pago em: ${formatDate(invoice.payment_date)}"` : '';

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.purchase_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.due_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(invoice.total_value)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${invoice.status === 'paga'
          ? 'bg-green-100 text-green-800'
          : (isInvoiceOverdue
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800')}" ${paymentInfo}>
            ${invoice.status === 'paga' ? 'Paga' : (isInvoiceOverdue ? 'Vencida' : 'Pendente')}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="view-invoice mr-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors" data-id="${invoice.id}">
            Visualizar
          </button>
          <button class="pay-invoice px-3 py-1 rounded-full ${invoice.status === 'paga' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'} transition-colors" data-id="${invoice.id}" ${invoice.status === 'paga' ? 'disabled' : ''}>
            ${invoice.status === 'paga' ? 'Paga' : 'Pagar'}
          </button>
        </td>
      `;
      invoicesTable.appendChild(row);
    });
  }

  // Renderizar controles de paginação
  renderInvoicePaginationControls(pagination);

  // Configurar eventos
  setupClientProfileEvents();
}

// Voltar para a lista de clientes
function backToClientsList() {
  document.querySelector('.tab[data-tab="clients"]').click();
}

// Renderizar controles de paginação
function renderInvoicePaginationControls(pagination) {
  const paginationContainer = document.getElementById('invoice-pagination-controls');

  if (!paginationContainer) return;

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div class="flex justify-between flex-1 sm:hidden">
        <button 
          onclick="navigateInvoicePage(${pagination.page - 1})"
          ${pagination.page === 1 ? 'disabled' : ''}
          class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Anterior
        </button>
        <button 
          onclick="navigateInvoicePage(${pagination.page + 1})"
          ${pagination.page === pagination.totalPages ? 'disabled' : ''}
          class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
          Próximo
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando <span class="font-medium">${((pagination.page - 1) * pagination.limit) + 1}</span> a 
            <span class="font-medium">${Math.min(pagination.page * pagination.limit, pagination.total)}</span> de 
            <span class="font-medium">${pagination.total}</span> resultados
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <button 
              onclick="navigateInvoicePage(${pagination.page - 1})"
              ${pagination.page === 1 ? 'disabled' : ''}
              class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
              <span class="sr-only">Anterior</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            ${generateInvoicePageNumbers(pagination)}
            <button 
              onclick="navigateInvoicePage(${pagination.page + 1})"
              ${pagination.page === pagination.totalPages ? 'disabled' : ''}
              class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}">
              <span class="sr-only">Próximo</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `;
}

// Gerar números de página
function generateInvoicePageNumbers(pagination) {
  let pages = '';
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.totalPages, pagination.page + 2);

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === pagination.page;
    pages += `
      <button 
        onclick="navigateInvoicePage(${i})"
        class="relative inline-flex items-center px-4 py-2 text-sm font-medium ${isActive
        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
      }">
        ${i}
      </button>
    `;
  }
  return pages;
}

// Navegar para página de notas
window.navigateInvoicePage = function (page) {
  if (page < 1 || page > totalInvoicePages) return;
  loadClientInvoices(currentClientId, page);
};

// Função para pagar nota no perfil
async function payInvoice(invoiceId) {
  // IMPORTANTE: Remover o try/catch aqui e colocar dentro do callback
  confirmation.confirm('Deseja marcar esta nota como paga?', async () => {
    try {
      // Código executado quando confirmado
      await invoiceService.payInvoice(invoiceId);
      
      // Recarregar notas do cliente na página atual
      await loadClientInvoices(currentClientId, currentInvoicePage);
      
      // Verificar se o dashboard está visível e recarregá-lo
      if (document.getElementById('dashboard').classList.contains('active')) {
        const dashboard = require('./dashboard');
        await dashboard.loadDashboard();
      }
    } catch (error) {
      console.error('Erro ao pagar nota:', error);
      notification.error(`Erro ao pagar nota: ${error.message}`);
    }
  });
}

// Configurar eventos da página de perfil
function setupClientProfileEvents() {
  // Botão de voltar
  document.getElementById('back-to-clients').addEventListener('click', backToClientsList);

  // Botão de gerar relatório
  const generateReportBtn = document.getElementById('generate-client-report');
  const generateBtnClone = generateReportBtn.cloneNode(true);
  generateReportBtn.parentNode.replaceChild(generateBtnClone, generateReportBtn);

  generateBtnClone.addEventListener('click', () => {
    generatePDF();
  });

  // Botão de editar cliente
  document.getElementById('edit-profile-client').addEventListener('click', () => {
    const { openClientModal } = require('../components/client/clientModal');
    openClientModal(currentClientId);
  });

  // Botão de nova nota - Adicionar debounce
  const newProfileInvoiceBtn = document.getElementById('new-profile-invoice');
  // Remover listeners antigos
  const newBtnClone = newProfileInvoiceBtn.cloneNode(true);
  newProfileInvoiceBtn.parentNode.replaceChild(newBtnClone, newProfileInvoiceBtn);

  newBtnClone.addEventListener('click', debounce(() => {
    const { openInvoiceModal } = require('../components/invoice/invoiceModal');
    openInvoiceModal(null, currentClientId);
  }, 300)); // 300ms de delay

  // Botões de visualizar nota
  document.querySelectorAll('.view-invoice').forEach(button => {
    button.addEventListener('click', (event) => {
      const invoiceId = event.target.dataset.id;
      openInvoiceModal(invoiceId);
    });
  });

  // Botões de pagar nota
  document.querySelectorAll('.pay-invoice').forEach(button => {
    if (!button.disabled) {
      button.addEventListener('click', (event) => {
        const invoiceId = event.target.dataset.id;
        payInvoice(invoiceId);
      });
    }
  });
}

// Adicione esta função após setupClientProfileEvents
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

module.exports = {
  loadClientProfile,
  backToClientsList,
  debounce,
  generatePDF
};