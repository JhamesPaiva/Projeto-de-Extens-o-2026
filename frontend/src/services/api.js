function resolveApiBaseUrl() {
  if (window.API_BASE_URL) return window.API_BASE_URL;

  const host = window.location.hostname;
  if (host === '127.0.0.1' || host === 'localhost') {
    // Evita falhas de fetch quando localhost resolve para ::1 e o backend escuta em IPv4.
    return 'http://127.0.0.1:5000/api';
  }

  return 'http://127.0.0.1:5000/api';
}

window.API_BASE_URL = resolveApiBaseUrl();

function buildFallbackApiBaseUrl(currentBase) {
  if (currentBase.includes('localhost')) {
    return currentBase.replace('localhost', '127.0.0.1');
  }
  if (currentBase.includes('127.0.0.1')) {
    return currentBase.replace('127.0.0.1', 'localhost');
  }
  return null;
}

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

  const requestInit = {
    ...options,
    headers,
    body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body,
  };

  let response;
  try {
    response = await fetch(`${window.API_BASE_URL}${path}`, requestInit);
  } catch (networkError) {
    const fallbackBase = buildFallbackApiBaseUrl(window.API_BASE_URL);
    if (!fallbackBase) {
      throw networkError;
    }

    console.warn('[api.js] network retry with fallback host', {
      from: window.API_BASE_URL,
      to: fallbackBase,
      path,
    });

    response = await fetch(`${fallbackBase}${path}`, requestInit);
  }

  const payload = await response.json().catch(() => ({}));
  console.log('[api.js] response]', response.status, payload);

  if (!response.ok) {
    const serverMessage = payload.message || payload.msg || `Erro na requisição (${response.status})`;
    const error = new Error(serverMessage);
    error.response = response;
    error.payload = {
      ...payload,
      message: serverMessage,
    };
    throw error;
  }

  return payload;
};
