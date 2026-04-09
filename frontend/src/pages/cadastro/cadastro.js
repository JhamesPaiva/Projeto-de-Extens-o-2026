  /* === Troca de tipo === */
  let tipoAtual = 'pf';

  function setTipo(tipo) {
    tipoAtual = tipo;

    document.getElementById('cardPF').classList.toggle('active', tipo === 'pf');
    document.getElementById('cardPJ').classList.toggle('active', tipo === 'pj');

    const blPF = document.getElementById('blocoPF');
    const blPJ = document.getElementById('blocoPJ');

    if (tipo === 'pf') {
      blPJ.style.display = 'none';
      blPF.style.display = 'block';
      blPF.classList.remove('form-bloco');
      void blPF.offsetWidth;
      blPF.classList.add('form-bloco');
      document.getElementById('txtBtnCadastrar').textContent = 'Criar minha conta';
    } else {
      blPF.style.display = 'none';
      blPJ.style.display = 'block';
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

  /* === Submit === */
  const form = document.getElementById('formCadastro');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!document.getElementById('chkTermos').checked) {
      alert('Você precisa aceitar os Termos de Uso para continuar.');
      return;
    }

    const btn = document.getElementById('btnCadastrar');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Criando conta...`;

    await new Promise(r => setTimeout(r, 1500));

    // Substituir pelo fetch real futuramente:
    // window.location.href = 'index.html';

    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-person-check-fill"></i> ${tipoAtual === 'pf' ? 'Criar minha conta' : 'Cadastrar Instituição'}`;
    alert('Conta criada com sucesso! Verifique seu e-mail para confirmação.');
  });