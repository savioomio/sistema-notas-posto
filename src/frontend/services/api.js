// src/frontend/services/api.js
// Serviço de API para comunicação com o backend

let apiUrl = 'http://localhost:3000';
let token = null;

// Configurar URL da API
function setApiUrl(url) {
  apiUrl = url;
  console.log(`URL da API configurada para: ${apiUrl}`);
}

// Configurar token
function setToken(newToken) {
  token = newToken;
  // Salvar token no localStorage
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
}

// Carregar token do localStorage
function loadToken() {
  token = localStorage.getItem('token');
  return token;
}

// Fazer requisição à API
async function request(endpoint, method = 'GET', data = null) {
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
    
    const response = await fetch(url, options);

    // Verificar status HTTP
    if (!response.ok) {
      const errorText = await response.text();
      
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

// Testar conexão com o servidor
async function testConnection() {
  try {
    console.log(`Testando conexão com: ${apiUrl}`);
    const response = await fetch(`${apiUrl}/api/clients`, {
      headers: {
        'Authorization': `Bearer ${token || 'no-token'}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Erro de conexão:', error);
    return false;
  }
}

// Exportar funções
module.exports = {
  setApiUrl,
  setToken,
  loadToken,
  request,
  testConnection
};