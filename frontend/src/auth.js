window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';

window.Auth = {
  LOGIN_PAGE: '../login/login.html',

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

  logout() {
    localStorage.removeItem('eventocom_token');
    localStorage.removeItem('eventocom_user');
    window.location.href = this.LOGIN_PAGE;
  },

  restore() {
    return !!this.getToken();
  },

  requireAuth() {
    if (!this.restore()) {
      window.location.href = this.LOGIN_PAGE;
      return false;
    }
    return true;
  },

  requireInstituicao() {
    const user = this.getUser();
    if (!user || user.tipo !== 'pj') {
      window.location.href = this.LOGIN_PAGE;
      return false;
    }
    return true;
  },

  async login(email, senha) {
    console.log('[auth.js] login', { email, senha });
    return await apiFetch('/login', {
      method: 'POST',
      body: { email, senha },
    });
  },

  async register(data) {
    console.log('[auth.js] register', data);
    return await apiFetch('/register', {
      method: 'POST',
      body: data,
    });
  },
};
