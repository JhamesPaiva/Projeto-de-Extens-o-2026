  console.log('[cadastro.js] carregado');

  /* === Troca de tipo === */
  let tipoAtual = 'pf';

  function initRequiredMarkers() {
    const fields = document.querySelectorAll('#blocoPF input, #blocoPF select, #blocoPF textarea, #blocoPJ input, #blocoPJ select, #blocoPJ textarea');
    fields.forEach((field) => {
      field.dataset.initialRequired = field.required ? '1' : '0';
    });
  }

  function setRequiredByBlock(blockEl, enabled) {
    if (!blockEl) return;
    const fields = blockEl.querySelectorAll('input, select, textarea');

    fields.forEach((field) => {
      const wasInitiallyRequired = field.dataset.initialRequired === '1';
      field.required = enabled ? wasInitiallyRequired : false;
    });
  }

  function setTipo(tipo) {
    tipoAtual = tipo;

    document.getElementById('cardPF').classList.toggle('active', tipo === 'pf');
    document.getElementById('cardPJ').classList.toggle('active', tipo === 'pj');

    const blPF = document.getElementById('blocoPF');
    const blPJ = document.getElementById('blocoPJ');

    if (tipo === 'pf') {
      blPJ.style.display = 'none';
      blPF.style.display = 'block';
      setRequiredByBlock(blPJ, false);
      setRequiredByBlock(blPF, true);
      blPF.classList.remove('form-bloco');
      void blPF.offsetWidth;
      blPF.classList.add('form-bloco');
      document.getElementById('txtBtnCadastrar').textContent = 'Criar minha conta';
    } else {
      blPF.style.display = 'none';
      blPJ.style.display = 'block';
      setRequiredByBlock(blPF, false);
      setRequiredByBlock(blPJ, true);
      blPJ.classList.remove('form-bloco');
      void blPJ.offsetWidth;
      blPJ.classList.add('form-bloco');
      document.getElementById('txtBtnCadastrar').textContent = 'Cadastrar Instituição';
    }
  }

  /* === Toggle senha === */
  function toggleSenha(inputId, iconeId) {
    const input = document.getElementById(inputId);
    const icone = document.getElementById(iconeId);
    const visivel = input.type === 'text';
    input.type = visivel ? 'password' : 'text';
    icone.className = visivel ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill';
  }

  /* === Força da senha === */
  function avaliarSenha(input, barrasId, labelId) {
    const val = input.value;
    let pontos = 0;
    if (val.length >= 8)           pontos++;
    if (/[A-Z]/.test(val))         pontos++;
    if (/[0-9]/.test(val))         pontos++;
    if (/[^a-zA-Z0-9]/.test(val))  pontos++;

    const cores   = ['#ef4444','#f97316','#eab308','#22c55e'];
    const labels  = ['Fraca','Regular','Boa','Forte'];

    for (let i = 1; i <= 4; i++) {
      const barra = document.getElementById(`${barrasId}-${i}`);
      barra.style.background = i <= pontos ? cores[pontos - 1] : '#e5e7eb';
    }
    const labelEl = document.getElementById(labelId);
    labelEl.textContent  = pontos > 0 ? labels[pontos - 1] : '';
    labelEl.style.color  = pontos > 0 ? cores[pontos - 1] : 'var(--muted)';
  }

  /* === Máscara CPF === */
  function maskCPF(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    el.value = v;
  }

  /* === Máscara CNPJ === */
  function maskCNPJ(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/(\d{2})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1/$2');
    v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    el.value = v;
  }

  /* === Máscara Telefone === */
  function maskTel(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else                v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    el.value = v;
  }

  /* === Máscara CEP === */
  function maskCEP(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    el.value = v;
  }

  document.getElementById('inputCPF').addEventListener('input',    () => maskCPF(document.getElementById('inputCPF')));
  document.getElementById('inputCPFResp').addEventListener('input', () => maskCPF(document.getElementById('inputCPFResp')));
  document.getElementById('inputCNPJ').addEventListener('input',   () => maskCNPJ(document.getElementById('inputCNPJ')));
  document.getElementById('inputTelPF').addEventListener('input',  () => maskTel(document.getElementById('inputTelPF')));
  document.getElementById('inputTelPJ').addEventListener('input',  () => maskTel(document.getElementById('inputTelPJ')));
  document.getElementById('inputCEPpf').addEventListener('input',  () => maskCEP(document.getElementById('inputCEPpf')));
  document.getElementById('inputCEPpj').addEventListener('input',  () => maskCEP(document.getElementById('inputCEPpj')));

  // Garante que apenas o bloco ativo tenha validação required.
  initRequiredMarkers();
  setTipo(tipoAtual);

  // Compatibilidade com handlers inline no HTML (onclick/oninput).
  window.setTipo = setTipo;
  window.toggleSenha = toggleSenha;
  window.avaliarSenha = avaliarSenha;

  function showStatus(message, type = 'danger') {
    let box = document.getElementById('cadastroStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'cadastroStatus';
      box.className = 'alert mt-3';
      const formEl = document.getElementById('formCadastro');
      formEl.insertAdjacentElement('beforebegin', box);
    }
    box.className = `alert alert-${type} mt-3`;
    box.textContent = message;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearStatus() {
    const box = document.getElementById('cadastroStatus');
    if (box) box.remove();
  }

  function getVisibleInvalidField(formEl) {
    const invalidFields = Array.from(formEl.querySelectorAll(':invalid'));
    return invalidFields.find((field) => {
      const style = window.getComputedStyle(field);
      return style.display !== 'none' && style.visibility !== 'hidden' && field.offsetParent !== null;
    }) || null;
  }

  function getFieldLabel(field) {
    const col = field.closest('.col-12, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6, .col-sm-8');
    const label = col ? col.querySelector('.form-label-custom') : null;
    return (label?.textContent || field.getAttribute('placeholder') || 'este campo').trim();
  }

  /* === Submit === */
  const form = document.getElementById('formCadastro');
  form.addEventListener('submit', async (e) => {
    console.log('[cadastro.js] submit acionado');
    e.preventDefault();
    clearStatus();

    if (!document.getElementById('chkTermos').checked) {
      showStatus('Você precisa aceitar os Termos de Uso para continuar.', 'warning');
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      const invalidField = getVisibleInvalidField(form);
      if (invalidField) {
        invalidField.focus();
        showStatus(`Preencha corretamente: ${getFieldLabel(invalidField)}.`, 'warning');
      } else {
        showStatus('Revise os campos obrigatórios antes de continuar.', 'warning');
      }
      return;
    }

    const btn = document.getElementById('btnCadastrar');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Criando conta...`;

    try {
      const payload = buildCadastroPayload();
      console.log('[cadastro.js] payload', payload);

      console.log('[cadastro.js] chamando Auth.register');
      const registerResult = await Auth.register(payload);
      console.log('[cadastro.js] registerResult', registerResult);

      console.log('[cadastro.js] chamando Auth.login');
      const loginResult = await Auth.login(payload.email, payload.senha);
      console.log('[cadastro.js] loginResult', loginResult);

      Auth.setSession(loginResult.user, loginResult.access_token);
      showStatus('Cadastro realizado com sucesso! Redirecionando...', 'success');
      window.location.href = '../home/home.html';
    } catch (error) {
      console.error('[cadastro.js] erro no submit', error);
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-person-check-fill"></i> ${tipoAtual === 'pf' ? 'Criar minha conta' : 'Cadastrar Instituição'}`;
      showStatus(error.payload?.message || 'Não foi possível completar o cadastro. Verifique os dados e tente novamente.');
    }
  });

  function buildCadastroPayload() {
    if (tipoAtual === 'pf') {
      const nome = document.querySelector('#blocoPF input[placeholder="Seu nome"]').value.trim();
      const sobrenome = document.querySelector('#blocoPF input[placeholder="Seu sobrenome"]').value.trim();
      const email = document.getElementById('inputEmailPF').value.trim().toLowerCase();
      const senha = document.getElementById('inputSenhaPF').value;
      const confirmar = document.getElementById('inputConfPF').value;
      const cpf = document.getElementById('inputCPF').value.replace(/\D/g, '');
      const telefone = document.getElementById('inputTelPF').value.trim();
      const cep = document.getElementById('inputCEPpf').value.trim();
      const cidade = document.getElementById('inputCidadePF').value.trim();
      const estado = document.getElementById('inputEstadoPF').value;

      if (senha !== confirmar) {
        throw { payload: { message: 'As senhas não coincidem.' } };
      }

      return {
        tipo: 'pf',
        nome: `${nome} ${sobrenome}`.trim(),
        email,
        senha,
        cpf,
        telefone,
        cep,
        cidade,
        estado,
      };
    }

    const nome = document.querySelector('#blocoPJ input[placeholder="Nome oficial da instituição"]').value.trim();
    const email = document.getElementById('inputEmailPJ').value.trim().toLowerCase();
    const senha = document.getElementById('inputSenhaPJ').value;
    const confirmar = document.getElementById('inputConfPJ').value;
    const cnpj = document.getElementById('inputCNPJ').value.replace(/\D/g, '');
    const telefone = document.getElementById('inputTelPJ').value.trim();
    const cep = document.getElementById('inputCEPpj').value.trim();
    const cidade = document.getElementById('inputCidadePJ').value.trim();
    const estado = document.getElementById('inputEstadoPJ').value;

    if (senha !== confirmar) {
      throw { payload: { message: 'As senhas não coincidem.' } };
    }

    return {
      tipo: 'pj',
      nome,
      email,
      senha,
      cnpj,
      telefone,
      cep,
      cidade,
      estado,
    };
  }
