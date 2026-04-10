window.API_BASE_URL = 'http://localhost:5000/api';

window.apiFetch = async function (path, options = {}) {
  const token = localStorage.getItem('eventocom_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log('[api.js] request]', {
    url: `${window.API_BASE_URL}${path}`,
    method: options.method || 'GET',
    body: options.body,
    headers,
  });

  const response = await fetch(`${window.API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body,
  });

  const payload = await response.json().catch(() => ({}));
  console.log('[api.js] response]', response.status, payload);

  if (!response.ok) {
    const error = new Error(payload.message || 'Erro na requisição');
    error.response = response;
    error.payload = payload;
    throw error;
  }

  return payload;
};
