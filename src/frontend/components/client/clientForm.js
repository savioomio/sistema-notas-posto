// src/frontend/components/client/clientForm.js
// Formulário de cadastro/edição de cliente

// Formatar CPF
function formatCPF(value) {
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return value;
}

// Formatar CNPJ
function formatCNPJ(value) {
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/, '$1.$2');
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  return value;
}

// Formatar telefone
function formatPhone(value) {
  value = value.replace(/\D/g, '');
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (value.length > 5) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (value.length > 0) {
    value = value.replace(/^(\d{0,2})/, '($1');
  }
  return value;
}

// Formatar CEP
function formatCEP(value) {
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{5})(\d{3}).*/, '$1-$2');
  return value;
}

// Validar CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

// Validar CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0), 10)) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1), 10)) return false;
  
  return true;
}

// Concatenar os campos de endereço
function concatenateAddress() {
  const cep = document.getElementById('client-cep').value.trim();
  const street = document.getElementById('client-street').value.trim();
  const number = document.getElementById('client-number').value.trim();
  const neighborhood = document.getElementById('client-neighborhood').value.trim();
  const city = document.getElementById('client-city').value.trim();
  const complement = document.getElementById('client-complement').value.trim();
  
  let address = '';
  
  if (street) address += street;
  if (number) address += `, ${number}`;
  if (neighborhood) address += `, ${neighborhood}`;
  if (city) address += `, ${city}`;
  if (cep) address += `, CEP: ${cep}`;
  if (complement) address += `, ${complement}`;
  
  document.getElementById('client-address').value = address;
}

// Validar formulário de cliente
function validateClientForm() {
  const type = document.querySelector('input[name="client-type"]:checked').value;
  const name = document.getElementById('client-name').value.trim();
  const documentValue = document.getElementById('client-document').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  
  // Validar campos obrigatórios
  if (!name) {
    return { 
      valid: false, 
      message: 'Preencha o nome do cliente' 
    };
  }
  
  if (!documentValue) {
    return { 
      valid: false, 
      message: 'Preencha o documento do cliente' 
    };
  }
  
  // Validar CPF/CNPJ
  if (type === 'PF') {
    if (!validateCPF(documentValue)) {
      return {
        valid: false,
        message: 'CPF inválido'
      };
    }
  } else if (type === 'PJ') {
    if (!validateCNPJ(documentValue)) {
      return {
        valid: false,
        message: 'CNPJ inválido'
      };
    }
  }
  
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { 
      valid: false, 
      message: 'Telefone inválido' 
    };
  }
  
  // Concatenar campos de endereço
  concatenateAddress();
  
  return { valid: true };
}

// Obter dados do formulário
function getClientFormData() {
  const clientId = document.getElementById('client-id').value;
  const type = document.querySelector('input[name="client-type"]:checked').value;
  const name = document.getElementById('client-name').value.trim();
  const documentValue = document.getElementById('client-document').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  
  // Garantir que o endereço está concatenado
  concatenateAddress();
  const address = document.getElementById('client-address').value;

  return {
    id: clientId || null,
    type,
    name,
    document: documentValue,
    address,
    phone
  };
}

// Preencher formulário com dados do cliente
function fillClientForm(client) {
  document.getElementById('client-id').value = client.id;
  
  // Selecionar o tipo de cliente
  const radioPF = document.querySelector('input[name="client-type"][value="PF"]');
  const radioPJ = document.querySelector('input[name="client-type"][value="PJ"]');
  
  if (client.type === 'PF') {
    radioPF.checked = true;
    updateClientTypeUI('PF');
  } else {
    radioPJ.checked = true;
    updateClientTypeUI('PJ');
  }
  
  document.getElementById('client-name').value = client.name;
  document.getElementById('client-document').value = client.document;
  document.getElementById('client-phone').value = client.phone;
  
  // Processar o endereço para preencher os campos individuais
  if (client.address) {
    document.getElementById('client-address').value = client.address;
    
    // Tentativa de extrair informações do endereço
    const addressParts = client.address.split(', ');
    
    if (addressParts.length > 0) {
      document.getElementById('client-street').value = addressParts[0] || '';
      
      if (addressParts.length > 1) {
        document.getElementById('client-number').value = addressParts[1] || '';
      }
      
      if (addressParts.length > 2) {
        document.getElementById('client-neighborhood').value = addressParts[2] || '';
      }
      
      if (addressParts.length > 3) {
        document.getElementById('client-city').value = addressParts[3] || '';
      }
      
      // Tentar extrair CEP
      const cepMatch = client.address.match(/CEP: (\d{5}-\d{3})/);
      if (cepMatch) {
        document.getElementById('client-cep').value = cepMatch[1];
      }
      
      // Complemento é mais difícil de extrair com precisão
      if (addressParts.length > 5) {
        document.getElementById('client-complement').value = addressParts[addressParts.length - 1];
      }
    }
  } else {
    // Limpar campos de endereço se não houver endereço
    document.getElementById('client-street').value = '';
    document.getElementById('client-number').value = '';
    document.getElementById('client-neighborhood').value = '';
    document.getElementById('client-city').value = '';
    document.getElementById('client-cep').value = '';
    document.getElementById('client-complement').value = '';
  }
}

// Atualizar interface com base no tipo de cliente
function updateClientTypeUI(type) {
  // Atualizar as classes dos botões de opção
  document.querySelectorAll('.client-type-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  const selectedOption = document.querySelector(`.client-type-option input[value="${type}"]`).closest('.client-type-option');
  selectedOption.classList.add('selected');
  
  // Atualizar label e placeholder do campo de documento
  const documentLabel = document.getElementById('document-label');
  const documentInput = document.getElementById('client-document');
  
  if (type === 'PF') {
    documentLabel.textContent = 'CPF:';
    documentInput.placeholder = '000.000.000-00';
    // Formatar o valor atual como CPF se existir
    if (documentInput.value) {
      documentInput.value = formatCPF(documentInput.value);
    }
  } else {
    documentLabel.textContent = 'CNPJ:';
    documentInput.placeholder = '00.000.000/0000-00';
    // Formatar o valor atual como CNPJ se existir
    if (documentInput.value) {
      documentInput.value = formatCNPJ(documentInput.value);
    }
  }
}

// Limpar formulário
function clearClientForm() {
  document.getElementById('client-form').reset();
  document.getElementById('client-id').value = '';
  document.getElementById('client-address').value = '';
  
  // Limpar campos individuais de endereço
  document.getElementById('client-street').value = '';
  document.getElementById('client-number').value = '';
  document.getElementById('client-neighborhood').value = '';
  document.getElementById('client-city').value = '';
  document.getElementById('client-cep').value = '';
  document.getElementById('client-complement').value = '';
  
  // Resetar para o tipo PF
  const radioPF = document.querySelector('input[name="client-type"][value="PF"]');
  radioPF.checked = true;
  updateClientTypeUI('PF');
}

// Configurar máscaras e validações
function setupFormMasks() {
  // Máscara para CPF/CNPJ
  const documentInput = document.getElementById('client-document');
  documentInput.addEventListener('input', function() {
    const type = document.querySelector('input[name="client-type"]:checked').value;
    if (type === 'PF') {
      this.value = formatCPF(this.value);
      // Limitar tamanho
      if (this.value.length > 14) this.value = this.value.slice(0, 14);
    } else {
      this.value = formatCNPJ(this.value);
      // Limitar tamanho
      if (this.value.length > 18) this.value = this.value.slice(0, 18);
    }
  });
  
  // Máscara para telefone
  const phoneInput = document.getElementById('client-phone');
  phoneInput.addEventListener('input', function() {
    this.value = formatPhone(this.value);
    // Limitar tamanho
    if (this.value.length > 15) this.value = this.value.slice(0, 15);
  });
  
  // Máscara para CEP
  const cepInput = document.getElementById('client-cep');
  cepInput.addEventListener('input', function() {
    this.value = formatCEP(this.value);
    // Limitar tamanho
    if (this.value.length > 9) this.value = this.value.slice(0, 9);
  });
  
  // Configurar eventos para mudança de tipo de cliente
  const clientTypeRadios = document.querySelectorAll('input[name="client-type"]');
  clientTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      updateClientTypeUI(this.value);
    });
  });
}

module.exports = {
  validateClientForm,
  getClientFormData,
  fillClientForm,
  clearClientForm,
  setupFormMasks,
  updateClientTypeUI
};