function resolveApiBaseUrl() {
  const host = window.location.hostname;
  if (host === '127.0.0.1' || host === 'localhost') {
    return 'http://127.0.0.1:5000/api';
  }

  return 'http://127.0.0.1:5000/api';
}

function buildFallbackApiBaseUrl(currentBase) {
  if (currentBase.includes('localhost')) {
    return currentBase.replace('localhost', '127.0.0.1');
  }
  if (currentBase.includes('127.0.0.1')) {
    return currentBase.replace('127.0.0.1', 'localhost');
  }
  return null;
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('eventocom_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestInit = {
    ...options,
    headers,
    body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  } catch (networkError) {
    const fallbackBase = buildFallbackApiBaseUrl(API_BASE_URL);
    if (!fallbackBase) {
      throw networkError;
    }

    response = await fetch(`${fallbackBase}${path}`, requestInit);
  }

  const payload = await response.json().catch(() => ({}));

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
}