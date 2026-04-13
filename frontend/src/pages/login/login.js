import { authService } from '../../core/auth/auth-service.js';

const btnToggle = document.getElementById('btnToggleSenha');
const inputSenha = document.getElementById('inputSenha');
const iconeSenha = document.getElementById('iconeSenha');
const form = document.getElementById('formLogin');
const btnEntrar = document.getElementById('btnEntrar');
const alertaEl = document.getElementById('alertaErro');
const msgErroEl = document.getElementById('msgErro');

btnToggle.addEventListener('click', () => {
  const visivel = inputSenha.type === 'text';
  inputSenha.type = visivel ? 'password' : 'text';
  iconeSenha.className = visivel ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertaEl.classList.add('d-none');

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const email = document.getElementById('inputEmail').value.trim().toLowerCase();
  const senha = inputSenha.value;

  btnEntrar.disabled = true;
  btnEntrar.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    Entrando...
  `;

  try {
    const result = await authService.login(email, senha);
    authService.setSession(result.user, result.access_token);
    window.location.href = '../home/home.html';
  } catch (error) {
    btnEntrar.disabled = false;
    btnEntrar.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Entrar';
    alertaEl.classList.remove('d-none');
    msgErroEl.textContent = error.payload?.message || 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  }
});