  /* === Toggle visibilidade da senha === */
  const btnToggle  = document.getElementById('btnToggleSenha');
  const inputSenha = document.getElementById('inputSenha');
  const iconeSenha = document.getElementById('iconeSenha');

  btnToggle.addEventListener('click', () => {
    const visivel = inputSenha.type === 'text';
    inputSenha.type = visivel ? 'password' : 'text';
    iconeSenha.className = visivel ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill';
  });

  /* === Validação + simulação de submit === */
  const form      = document.getElementById('formLogin');
  const btnEntrar = document.getElementById('btnEntrar');
  const alertaEl  = document.getElementById('alertaErro');
  const msgErroEl = document.getElementById('msgErro');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertaEl.classList.add('d-none');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Estado de carregando
    btnEntrar.disabled = true;
    btnEntrar.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status"></span>
      Entrando...
    `;

    // Simulação de requisição (substituir pelo fetch real futuramente)
    await new Promise(r => setTimeout(r, 1400));

    // Exemplo: redireciona para home após login bem-sucedido
    // window.location.href = 'index.html';

    // Simulação de erro para demonstração
    btnEntrar.disabled = false;
    btnEntrar.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Entrar`;
    alertaEl.classList.remove('d-none');
    msgErroEl.textContent = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  });