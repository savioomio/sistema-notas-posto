// src/frontend/components/invoice/invoiceForm.js
const { formatDateForInput } = require('../../assets/js/utils');

// Validar formulário de nota
function validateInvoiceForm() {
  const clientId = document.getElementById('invoice-client-id').value;
  const purchaseDate = document.getElementById('invoice-purchase-date').value;
  const dueDate = document.getElementById('invoice-due-date').value;
  const status = document.getElementById('invoice-status').value;
  const totalValue = parseFloat(document.getElementById('invoice-total').value);

  // Validar campos obrigatórios
  if (!clientId) {
    return { 
      valid: false, 
      message: 'Selecione um cliente' 
    };
  }

  if (!purchaseDate) {
    return { 
      valid: false, 
      message: 'Informe a data de compra' 
    };
  }

  if (!dueDate) {
    return { 
      valid: false, 
      message: 'Informe a data de vencimento' 
    };
  }

  if (isNaN(totalValue) || totalValue <= 0) {
    return { 
      valid: false, 
      message: 'Informe um valor total válido' 
    };
  }

  // Validar produtos
  const products = getInvoiceProducts();
  if (products.length === 0) {
    return { 
      valid: false, 
      message: 'Adicione pelo menos um produto' 
    };
  }

  return { valid: true };
}

// Obter produtos da nota
function getInvoiceProducts() {
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

  return products;
}

// Obter dados do formulário
function getInvoiceFormData() {
  const invoiceId = document.getElementById('invoice-id').value;
  const clientId = document.getElementById('invoice-client-id').value;
  const purchaseDate = document.getElementById('invoice-purchase-date').value;
  const dueDate = document.getElementById('invoice-due-date').value;
  const status = document.getElementById('invoice-status').value;
  const totalValue = parseFloat(document.getElementById('invoice-total').value);
  
  // Obter produtos
  const products = getInvoiceProducts();

  return {
    id: invoiceId || null,
    client_id: parseInt(clientId),
    purchase_date: purchaseDate,
    due_date: dueDate,
    status,
    total_value: totalValue,
    products
  };
}

// Preencher formulário com dados da nota
function fillInvoiceForm(invoice) {
  document.getElementById('invoice-id').value = invoice.id;
  document.getElementById('invoice-client-id').value = invoice.client_id;
  document.getElementById('invoice-purchase-date').value = formatDateForInput(invoice.purchase_date);
  document.getElementById('invoice-due-date').value = formatDateForInput(invoice.due_date);
  document.getElementById('invoice-status').value = invoice.status;
  document.getElementById('invoice-total').value = invoice.total_value;

  // Limpar produtos
  document.getElementById('products-container').innerHTML = '';

  // Adicionar produtos
  if (invoice.products && invoice.products.length > 0) {
    invoice.products.forEach(product => {
      addProductField(product.name, product.value);
    });
  } else {
    // Adicionar pelo menos um campo de produto vazio
    addProductField();
  }
}

// Limpar formulário
function clearInvoiceForm() {
  document.getElementById('invoice-form').reset();
  document.getElementById('invoice-id').value = '';
  document.getElementById('invoice-client-id').value = ''; // Limpar ID do cliente
  
  // Limpar completamente o container de produtos
  const productsContainer = document.getElementById('products-container');
  productsContainer.innerHTML = '';
  
  // Limpar campo de busca
  const clientSearch = document.getElementById('invoice-client-search');
  if (clientSearch) {
    clientSearch.value = '';
  }
  
  // Limpar display do cliente
  const clientDisplay = document.getElementById('invoice-selected-client-display');
  if (clientDisplay) {
    clientDisplay.classList.add('hidden');
    clientDisplay.innerHTML = '';
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

  // Adicionar evento para remover produto - certifique-se de que está sendo vinculado corretamente
  const removeButton = productItem.querySelector('.remove-product');
  if (removeButton) {
    removeButton.addEventListener('click', removeProductField);
  }

  // Adicionar ao container
  productsContainer.appendChild(productItem);
  
  // Recalcular o valor total após adicionar o produto
  setTimeout(calculateTotalValue, 0); // Usando setTimeout para garantir que a UI foi atualizada
}

// Remover campo de produto
function removeProductField(event) {
  const button = event.currentTarget;
  // O problema pode estar em como estamos encontrando o elemento pai
  // Vamos garantir que estamos removendo todo o container do produto
  const productItem = button.closest('.product-item');
  if (productItem) {
    productItem.remove();
    // Também devemos recalcular o valor total após a remoção
    calculateTotalValue();
  }
}

// Calcular valor total com base nos produtos
function calculateTotalValue() {
  const products = getInvoiceProducts();
  const total = products.reduce((sum, product) => sum + product.value, 0);
  document.getElementById('invoice-total').value = total.toFixed(2);
}

module.exports = {
  validateInvoiceForm,
  getInvoiceFormData,
  fillInvoiceForm,
  clearInvoiceForm,
  addProductField,
  removeProductField,
  calculateTotalValue
};