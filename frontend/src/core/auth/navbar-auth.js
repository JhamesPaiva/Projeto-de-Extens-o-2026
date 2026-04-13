import { authService } from './auth-service.js';

/**
 * Inicializa o estado autenticado da navbar para páginas públicas.
 * Mantém o layout padrão de visitante quando não há sessão válida.
 */
export function initializeAuthenticatedNavbar(options = {}) {
  const {
    logoutButtonId = 'navLogoutBtn',
    navSelector = '.navbar .d-flex',
    redirectOnLogout,
  } = options;

  authService.restore();

  const user = authService.getUser();
  const navActions = document.querySelector(navSelector);
  if (!navActions || !user) return;

  const userTipo = String(user.tipo || '').trim().toLowerCase();
  const firstName = String(user.nome || user.email || 'Usuario').split(' ')[0];
  const initials = String(user.nome || user.email || 'US')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || 'US';

  const avatarHtml = user.avatar_data
    ? `<span class="nav-user-avatar"><img src="${escapeHtml(user.avatar_data)}" alt="Avatar de ${escapeHtml(firstName)}"/></span>`
    : `<span class="nav-user-avatar">${escapeHtml(initials)}</span>`;

  const areaLink = userTipo === 'pj'
    ? '../areausuarioinstituição/areausuarioinst.html'
    : '../areausuariofisico/areausuario.html';

  const createEventButton = userTipo === 'pj'
    ? `<a href="../criarevento.html/evento.html" class="btn btn-nav-create"><i class="bi bi-plus-circle me-1"></i>Crie seu Evento</a>`
    : '';

  navActions.innerHTML = `
    <span class="nav-user-chip text-white">${avatarHtml}<span>Ola, ${escapeHtml(firstName)}!</span></span>
    <a href="${areaLink}" class="btn btn-nav-register"><i class="bi bi-person-circle me-1"></i>Minha Area</a>
    <button type="button" id="${logoutButtonId}" class="btn btn-nav-login"><i class="bi bi-box-arrow-right me-1"></i>Sair</button>
    ${createEventButton}
  `;

  const logoutBtn = document.getElementById(logoutButtonId);
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    if (redirectOnLogout) {
      authService.logout(redirectOnLogout);
      return;
    }
    authService.logout();
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}
