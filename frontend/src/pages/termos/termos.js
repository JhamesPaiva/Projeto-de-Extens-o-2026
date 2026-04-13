import { initializeAuthenticatedNavbar } from '../../core/auth/navbar-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeAuthenticatedNavbar({ logoutButtonId: 'termosLogoutBtn' });
});
