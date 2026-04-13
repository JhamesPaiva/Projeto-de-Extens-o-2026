import { apiFetch } from '../api/client.js';

function parseJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
    return JSON.parse(decoded);
  } catch (_) {
    return null;
  }
}

export const authService = {
  LOGIN_PAGE: '../login/login.html',
  HOME_PAGE: '../home/home.html',

  clearSession() {
    localStorage.removeItem('eventocom_token');
    localStorage.removeItem('eventocom_user');
  },

  setSession(user, token) {
    localStorage.setItem('eventocom_token', token);
    localStorage.setItem('eventocom_user', JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem('eventocom_token');
  },

  getUser() {
    const data = localStorage.getItem('eventocom_user');
    return data ? JSON.parse(data) : null;
  },

  updateUser(partialUser = {}) {
    const current = this.getUser() || {};
    const updated = { ...current, ...partialUser };
    localStorage.setItem('eventocom_user', JSON.stringify(updated));
    return updated;
  },

  logout(redirectTo = this.HOME_PAGE) {
    this.clearSession();
    window.location.href = redirectTo;
  },

  restore() {
    const token = this.getToken();
    if (!token) return false;

    const payload = parseJwtPayload(token);
    if (!payload) {
      this.clearSession();
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = typeof payload.exp === 'number' && payload.exp < now;
    const invalidSubject = typeof payload.sub !== 'string';

    if (expired || invalidSubject) {
      this.clearSession();
      return false;
    }

    return true;
  },

  requireAuth(redirectTo = this.LOGIN_PAGE) {
    if (!this.restore()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  requireInstituicao(redirectTo = this.LOGIN_PAGE) {
    if (!this.restore()) {
      window.location.href = redirectTo;
      return false;
    }

    const user = this.getUser();
    const tipo = String(user?.tipo || '').toLowerCase();
    if (!user || tipo !== 'pj') {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  async login(email, senha) {
    return apiFetch('/login', {
      method: 'POST',
      body: { email, senha },
    });
  },

  async register(data) {
    return apiFetch('/register', {
      method: 'POST',
      body: data,
    });
  },
};