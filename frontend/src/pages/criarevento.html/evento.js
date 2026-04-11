  /* === Proteção da página === */
  (function() {
    if (!Auth.requireInstituicao()) return;
    const user = Auth.getUser();
    document.getElementById('nomeUsuario').textContent = user.nome;
  })();

  /* === Steps === */
  let currentStep = 1;
  const totalSteps = 5;

  function goStep(n) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`si-${currentStep}`).classList.remove('active');
    document.getElementById(`si-${currentStep}`).classList.add('done');
    document.getElementById(`sc-${currentStep}`) && document.getElementById(`sc-${currentStep}`).classList.add('done');

    currentStep = n;
    document.getElementById(`step${n}`).classList.add('active');

    // Atualiza steps futuros
    for (let i = n; i <= totalSteps; i++) {
      document.getElementById(`si-${i}`)?.classList.remove('done');
    }
    document.getElementById(`si-${n}`).classList.add('active');
    document.getElementById(`si-${n}`).classList.remove('done');

    if (n === 5) buildResumo();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* === Preview sidebar === */
  function updatePreview() {
    const nome     = document.getElementById('ev-nome')?.value || '';
    const cat      = document.getElementById('ev-categoria')?.value || '';
    const dataVal  = document.getElementById('ev-data-ini')?.value || '';
    const formato  = document.getElementById('ev-formato')?.value || '';
    const entrada  = document.getElementById('ev-entrada')?.value || '';
    const localNome= document.getElementById('ev-local-nome')?.value || '';
    const cidade   = document.getElementById('ev-cidade')?.value || '';
    const estado   = document.getElementById('ev-estado')?.value || '';

    set('prev-nome',   nome   || 'Não preenchido', !nome);
    set('prev-cat',    cat    || '—', !cat);
    set('prev-formato', formato ? formato.charAt(0).toUpperCase() + formato.slice(1) : '—', !formato);
    set('prev-entrada', entrada ? (entrada === 'gratuito' ? 'Gratuito' : 'Pago') : '—', !entrada);

    if (dataVal) {
      const d = new Date(dataVal + 'T00:00:00');
      set('prev-data', d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }), false);
    } else { set('prev-data', '—', true); }

    const localStr = [localNome, cidade, estado].filter(Boolean).join(', ');
    set('prev-local', localStr || '—', !localStr);
  }

  function set(id, val, empty) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    el.classList.toggle('empty', empty);
  }

  /* === Char counter === */
  function charCount(el, countId, max) {
    document.getElementById(countId).textContent = el.value.length;
  }

  /* === Formato === */
  function toggleFormato() {
    const v = document.getElementById('ev-formato').value;
    document.getElementById('camposEndereco').style.display = (v === 'online') ? 'none' : 'block';
    document.getElementById('camposOnline').style.display   = (v === 'presencial') ? 'none' : 'block';
  }

  /* === Ingressos === */
  let ingressoCount = 1;

  function addIngresso() {
    ingressoCount++;
    const id = ingressoCount;
    const div = document.createElement('div');
    div.className = 'ingresso-item';
    div.id = `ingresso-${id}`;
    div.innerHTML = `
      <button class="btn-remove-ingresso" type="button" onclick="removeIngresso(${id})">
        <i class="bi bi-trash3-fill"></i>
      </button>
      <div class="row g-2 align-items-center">
        <div class="col-12 col-sm-4">
          <label class="form-label-custom">Tipo</label>
          <div class="input-wrap">
            <i class="bi bi-ticket-fill input-icon"></i>
            <input type="text" class="form-control input-custom" placeholder="Ex: Meia, VIP..."/>
          </div>
        </div>
        <div class="col-6 col-sm-3">
          <label class="form-label-custom">Preço (R$)</label>
          <div class="input-wrap">
            <i class="bi bi-currency-dollar input-icon"></i>
            <input type="number" class="form-control input-custom" placeholder="0,00" min="0" step="0.01"
              id="preco-${id}" oninput="toggleGratuito(${id})"/>
          </div>
        </div>
        <div class="col-6 col-sm-3">
          <label class="form-label-custom">Qtd. Disponível</label>
          <div class="input-wrap">
            <i class="bi bi-hash input-icon"></i>
            <input type="number" class="form-control input-custom" placeholder="Ex: 100" min="1"/>
          </div>
        </div>
        <div class="col-12 col-sm-2 d-flex align-items-end pb-1">
          <div class="form-check form-switch ms-1">
            <input class="form-check-input" type="checkbox" id="gratis-${id}" onchange="setGratuito(${id})"/>
            <label class="form-check-label" for="gratis-${id}" style="font-size:.78rem;color:var(--muted);">Gratuito</label>
          </div>
        </div>
      </div>`;
    document.getElementById('listaIngressos').appendChild(div);
  }

  function removeIngresso(id) {
    document.getElementById(`ingresso-${id}`)?.remove();
  }

  function setGratuito(id) {
    const chk = document.getElementById(`gratis-${id}`);
    const preco = document.getElementById(`preco-${id}`);
    if (chk.checked) { preco.value = '0'; preco.disabled = true; }
    else { preco.disabled = false; }
  }

  function toggleGratuito(id) {
    const preco = document.getElementById(`preco-${id}`);
    const chk   = document.getElementById(`gratis-${id}`);
    if (preco && chk) chk.checked = parseFloat(preco.value) === 0;
  }

  /* === Upload imagem === */
  function previewImagem(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('uploadArea').style.display = 'none';
      const prev = document.getElementById('uploadPreview');
      prev.style.display = 'block';
      const img = document.getElementById('previewImg');
      img.src = e.target.result;
      // Sidebar
      const sideImg = document.getElementById('prev-thumb');
      sideImg.src = e.target.result;
      sideImg.style.display = 'block';
      sideImg.parentElement.querySelector('.thumb-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function removeImagem() {
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    const sideImg = document.getElementById('prev-thumb');
    sideImg.src = ''; sideImg.style.display = 'none';
    sideImg.parentElement.querySelector('.thumb-placeholder').style.display = '';
  }

  /* Drag & drop */
  const ua = document.getElementById('uploadArea');
  ['dragover','dragenter'].forEach(e => ua.addEventListener(e, ev => { ev.preventDefault(); ua.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(e => ua.addEventListener(e, ev => { ev.preventDefault(); ua.classList.remove('dragover'); }));
  ua.addEventListener('drop', ev => {
    const file = ev.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer(); dt.items.add(file);
      const fi = ua.querySelector('input[type=file]'); fi.files = dt.files;
      previewImagem(fi);
    }
  });

  /* === CEP mask === */
  document.getElementById('cepEvento')?.addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'').slice(0,8);
    this.value = v.replace(/(\d{5})(\d{1,3})/,'$1-$2');
  });

  /* === Resumo step 5 === */
  function buildResumo() {
    const nome     = document.getElementById('ev-nome')?.value || '—';
    const cat      = document.getElementById('ev-categoria')?.value || '—';
    const desc     = document.getElementById('ev-desc-curta')?.value || '—';
    const dataIni  = document.getElementById('ev-data-ini')?.value || '—';
    const horaIni  = document.getElementById('ev-hora-ini')?.value || '—';
    const horaFim  = document.getElementById('ev-hora-fim')?.value || '';
    const formato  = document.getElementById('ev-formato')?.value || '—';
    const entrada  = document.getElementById('ev-entrada')?.value || 'gratuito';
    const cidade   = document.getElementById('ev-cidade')?.value || '—';
    const estado   = document.getElementById('ev-estado')?.value || '';
    const local    = document.getElementById('ev-local-nome')?.value || '—';
    const idade    = document.getElementById('ev-idade')?.value || '—';

    let dataFmt = dataIni;
    if (dataIni !== '—') {
      const d = new Date(dataIni + 'T00:00:00');
      dataFmt = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    }

    const campos = [
      { icon:'bi-stars',           label:'Nome',        val: nome },
      { icon:'bi-tags-fill',       label:'Categoria',   val: cat },
      { icon:'bi-person-fill',     label:'Faixa Etária',val: idade },
      { icon:'bi-calendar3',       label:'Data',        val: dataFmt },
      { icon:'bi-clock-fill',      label:'Horário',     val: horaFim ? `${horaIni} às ${horaFim}` : horaIni },
      { icon:'bi-display',         label:'Formato',     val: formato },
      { icon:'bi-ticket-perforated-fill', label:'Entrada', val: entrada === 'gratuito' ? 'Gratuito' : 'Pago' },
      { icon:'bi-building',        label:'Local',       val: local },
      { icon:'bi-geo-alt-fill',    label:'Cidade',      val: estado ? `${cidade} – ${estado}` : cidade },
      { icon:'bi-chat-left-text',  label:'Descrição',   val: desc },
    ];

    document.getElementById('resumoEvento').innerHTML = campos.map(c => `
      <div class="col-12 col-sm-6">
        <div style="display:flex;gap:10px;align-items:flex-start;padding:10px;background:#f9fafb;border-radius:10px;">
          <i class="bi ${c.icon}" style="color:var(--primary);margin-top:3px;flex-shrink:0;"></i>
          <div>
            <p style="font-family:var(--font-body);font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin:0;">${c.label}</p>
            <p style="font-family:var(--font-body);font-size:.9rem;color:var(--dark);font-weight:500;margin:2px 0 0;">${c.val || '—'}</p>
          </div>
        </div>
      </div>`).join('');
  }

  /* === Publicar === */
  async function publicarEvento() {
    if (!Auth.requireInstituicao()) return;
    if (!document.getElementById('chkPublicar').checked) {
      alert('Por favor, confirme os Termos para Organizadores antes de publicar.');
      return;
    }

    const previewSrc = document.getElementById('previewImg')?.src || '';
    const imagemUrl = previewSrc || null;

    const entradaSelecionada = (document.getElementById('ev-entrada')?.value || '').trim().toLowerCase();
    const entrada = entradaSelecionada === 'pago' ? 'pago' : 'gratuito';

    const payload = {
      nome: document.getElementById('ev-nome')?.value.trim(),
      categoria: document.getElementById('ev-categoria')?.value,
      idade: document.getElementById('ev-idade')?.value,
      descricao: document.getElementById('ev-desc-completa')?.value.trim(),
      data_inicio: document.getElementById('ev-data-ini')?.value,
      hora_inicio: document.getElementById('ev-hora-ini')?.value,
      hora_fim: document.getElementById('ev-hora-fim')?.value,
      formato: document.getElementById('ev-formato')?.value,
      entrada,
      local_nome: document.getElementById('ev-local-nome')?.value.trim(),
      cidade: document.getElementById('ev-cidade')?.value.trim(),
      estado: document.getElementById('ev-estado')?.value,
      imagem_url: imagemUrl,
    };

    if (!payload.nome || !payload.data_inicio) {
      alert('Nome do evento e data são obrigatórios.');
      return;
    }

    try {
      await apiFetch('/events', {
        method: 'POST',
        body: payload,
      });
      const modal = new bootstrap.Modal(document.getElementById('modalSucesso'));
      modal.show();
    } catch (error) {
      const msg = error?.payload?.message || error?.payload?.msg || error?.message || 'Não foi possível publicar o evento. Tente novamente.';

      if (/subject must be a string|token inválido|token invalid|expired|jwt/i.test(String(msg).toLowerCase())) {
        alert('Sua sessão expirou ou está inválida. Faça login novamente para publicar o evento.');
        Auth.logout();
        return;
      }

      alert(msg);
    }
  }