/* =====================================================
   DADOS SIMULADOS DO USUÁRIO
   Futuramente substituir por fetch à API
   ===================================================== */
const dadosUsuario = {
  nome:        'João',
  sobrenome:   'Silva',
  cpf:         '123.456.789-00',
  nascimento:  '1995-06-15',
  telefone:    '(31) 99887-6655',
  genero:      'Masculino',
  email:       'pessoa@teste.com',
  cep:         '36880-000',
  cidade:      'Muriaé',
  estado:      'MG',
  bairro:      'Centro',
  membro:      'Março de 2025',
};

const eventosUsuario = [
  {
    id: 1, nome: 'Festival Verão Sonoro 2025', categoria: 'Música',
    data: '12', mes: 'Jul', dataFull: '12 de Julho de 2025',
    hora: '16h às 23h', local: 'Parque Municipal, São Paulo – SP',
    status: 'confirmado',
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  },
  {
    id: 2, nome: 'Corrida Solidária 5K & 10K', categoria: 'Esportes',
    data: '26', mes: 'Jul', dataFull: '26 de Julho de 2025',
    hora: '07h às 12h', local: 'Aterro do Flamengo, Rio de Janeiro – RJ',
    status: 'confirmado',
    img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80',
  },
  {
    id: 3, nome: 'Hackathon Comunidade Tech 2025', categoria: 'Tecnologia',
    data: '09', mes: 'Ago', dataFull: '09 de Agosto de 2025',
    hora: '08h às 22h', local: 'Hub de Inovação, Recife – PE',
    status: 'pendente',
    img: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&q=80',
  },
  {
    id: 4, nome: 'Sabores da Cidade – Edição Especial', categoria: 'Gastronomia',
    data: '10', mes: 'Mar', dataFull: '10 de Março de 2025',
    hora: '11h às 20h', local: 'Praça Central, Belo Horizonte – MG',
    status: 'concluido',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  },
];

/* =====================================================
   INICIALIZAÇÃO
   ===================================================== */
;(function init() {
  /* Proteção: requer login como PF */
  Auth.restore();
  const user = Auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  /* Permite PF ou, se quiser testar, qualquer usuário */

  /* Preenche navbar */
  document.getElementById('navNome').textContent = dadosUsuario.nome + ' ' + dadosUsuario.sobrenome;

  /* Hero */
  document.getElementById('profileName').textContent  = dadosUsuario.nome + ' ' + dadosUsuario.sobrenome;
  document.getElementById('profileEmail').textContent = dadosUsuario.email;
  document.getElementById('avatarInitials').textContent =
    (dadosUsuario.nome[0] + dadosUsuario.sobrenome[0]).toUpperCase();

  /* Sidebar resumo */
  document.getElementById('membroDesde').textContent = dadosUsuario.membro;

  /* Campos de dados */
  setField('fv-nome',       dadosUsuario.nome);
  setField('fv-sobrenome',  dadosUsuario.sobrenome);
  document.getElementById('fv-cpf-val').textContent = dadosUsuario.cpf;
  setField('fv-nascimento', formatarData(dadosUsuario.nascimento));
  setField('fv-telefone',   dadosUsuario.telefone);
  setField('fv-genero',     dadosUsuario.genero);
  setField('fv-email',      dadosUsuario.email);
  setField('fv-cep',        dadosUsuario.cep);
  setField('fv-cidade',     dadosUsuario.cidade);
  setField('fv-estado',     dadosUsuario.estado);
  setField('fv-bairro',     dadosUsuario.bairro);

  /* Inputs de edição — preencher com valores atuais */
  val('fi-nome-input',       dadosUsuario.nome);
  val('fi-sobrenome-input',  dadosUsuario.sobrenome);
  val('fi-nascimento-input', dadosUsuario.nascimento);
  val('fi-telefone-input',   dadosUsuario.telefone);
  selOpt('fi-genero-input',  dadosUsuario.genero);
  val('fi-email-input',      dadosUsuario.email);
  val('fi-cep-input',        dadosUsuario.cep);
  val('fi-cidade-input',     dadosUsuario.cidade);
  selOpt('fi-estado-input',  dadosUsuario.estado);
  val('fi-bairro-input',     dadosUsuario.bairro);

  /* Renderiza eventos */
  renderEventos(eventosUsuario);
})();

function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '—';
}
function val(id, v)    { const el = document.getElementById(id); if (el) el.value = v || ''; }
function selOpt(id, v) {
  const sel = document.getElementById(id);
  if (!sel) return;
  for (const opt of sel.options) { if (opt.value === v || opt.text === v) { sel.value = opt.value; break; } }
}
function formatarData(iso) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} de ${meses[parseInt(m)-1]} de ${y}`;
}

/* =====================================================
   MODO EDIÇÃO
   ===================================================== */
function ativarEdicao(cardId, cancelId, saveId, editId) {
  document.getElementById(cardId).classList.add('editing');
  document.getElementById(cancelId).style.display = 'flex';
  document.getElementById(saveId).style.display   = 'flex';
  document.getElementById(editId).style.display   = 'none';
}

function cancelarEdicao(cardId, cancelId, saveId, editId) {
  document.getElementById(cardId).classList.remove('editing');
  document.getElementById(cancelId).style.display = 'none';
  document.getElementById(saveId).style.display   = 'none';
  document.getElementById(editId).style.display   = 'flex';
}

function salvarSecao(cardId, cancelId, saveId, editId, secao) {
  /* Lê os valores dos inputs e atualiza os displays */
  if (secao === 'pessoal') {
    const nome      = document.getElementById('fi-nome-input').value.trim();
    const sobrenome = document.getElementById('fi-sobrenome-input').value.trim();
    const nasc      = document.getElementById('fi-nascimento-input').value;
    const tel       = document.getElementById('fi-telefone-input').value.trim();
    const gen       = document.getElementById('fi-genero-input').value;

    setField('fv-nome',       nome      || '—');
    setField('fv-sobrenome',  sobrenome || '—');
    setField('fv-nascimento', nasc ? formatarData(nasc) : '—');
    setField('fv-telefone',   tel  || '—');
    setField('fv-genero',     gen  || '—');

    /* Atualiza nome no hero */
    document.getElementById('profileName').textContent = (nome + ' ' + sobrenome).trim();
    document.getElementById('navNome').textContent     = (nome + ' ' + sobrenome).trim();
    if (nome && sobrenome)
      document.getElementById('avatarInitials').textContent = (nome[0]+sobrenome[0]).toUpperCase();
  }

  if (secao === 'localizacao') {
    setField('fv-cep',    document.getElementById('fi-cep-input').value    || '—');
    setField('fv-cidade', document.getElementById('fi-cidade-input').value || '—');
    setField('fv-estado', document.getElementById('fi-estado-input').value || '—');
    setField('fv-bairro', document.getElementById('fi-bairro-input').value || '—');
  }

  if (secao === 'email') {
    const email = document.getElementById('fi-email-input').value.trim();
    setField('fv-email', email || '—');
    document.getElementById('profileEmail').textContent = email || '—';
  }

  cancelarEdicao(cardId, cancelId, saveId, editId);
  showToast('Dados salvos com sucesso!');
}

/* =====================================================
   AVATAR
   ===================================================== */
function trocarAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('avatarImg');
    img.src = e.target.result;
    img.style.display = 'block';
    document.getElementById('avatarInitials').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

/* =====================================================
   EVENTOS
   ===================================================== */
const statusLabels = {
  confirmado: 'Confirmado',
  pendente:   'Pendente',
  cancelado:  'Cancelado',
  concluido:  'Concluído',
};
const statusClasses = {
  confirmado: 'status-confirmado',
  pendente:   'status-pendente',
  cancelado:  'status-cancelado',
  concluido:  'status-concluido',
};

let cancelTarget = null;

function renderEventos(lista) {
  const grid  = document.getElementById('eventosGrid');
  const empty = document.getElementById('emptyState');

  if (!lista.length) {
    grid.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }
  empty.classList.add('d-none');

  grid.innerHTML = lista.map(ev => `
    <div class="ev-card" data-status="${ev.status}" data-id="${ev.id}">
      <div class="ev-card-img">
        <img src="${ev.img}" alt="${ev.nome}" loading="lazy"/>
        <div class="ev-date-badge">
          <span class="day">${ev.data}</span>
          <span class="mon">${ev.mes}</span>
        </div>
        <span class="ev-status-badge ${statusClasses[ev.status]}">${statusLabels[ev.status]}</span>
      </div>
      <div class="ev-card-body">
        <h6 class="ev-name">${ev.nome}</h6>
        <p class="ev-meta"><i class="bi bi-calendar3"></i>${ev.dataFull}</p>
        <p class="ev-meta"><i class="bi bi-clock-fill"></i>${ev.hora}</p>
        <p class="ev-meta"><i class="bi bi-geo-alt-fill"></i>${ev.local}</p>
      </div>
      <div class="ev-card-footer">
        <span class="btn-ev-detalhe">
          <i class="bi bi-eye me-1"></i>Detalhes
        </span>
        ${ev.status === 'confirmado' || ev.status === 'pendente' ? `
        <button class="btn-ev-cancelar" onclick="pedirCancelamento(${ev.id}, '${ev.nome.replace(/'/g,"\\'")}')">
          Cancelar
        </button>` : `<span></span>`}
      </div>
    </div>`).join('');
}

function filtrarEventos(status, btn) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const todos = eventosUsuario;
  const filtrados = status === 'todos' ? todos : todos.filter(e => e.status === status);
  renderEventos(filtrados);
}

function pedirCancelamento(id, nome) {
  cancelTarget = id;
  document.getElementById('modalEvNome').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalCancelar')).show();
}

function confirmarCancelamento() {
  if (!cancelTarget) return;
  const ev = eventosUsuario.find(e => e.id === cancelTarget);
  if (ev) ev.status = 'cancelado';
  bootstrap.Modal.getInstance(document.getElementById('modalCancelar'))?.hide();
  renderEventos(eventosUsuario);
  cancelTarget = null;
  showToast('Inscrição cancelada.');
  atualizarStats();
}

function atualizarStats() {
  const conf = eventosUsuario.filter(e=>e.status==='confirmado').length;
  const pend = eventosUsuario.filter(e=>e.status==='pendente').length;
  const conc = eventosUsuario.filter(e=>e.status==='concluido').length;
  const tot  = eventosUsuario.length;
  document.getElementById('st-total').textContent = tot;
  document.getElementById('st-conf').textContent  = conf;
  document.getElementById('st-pend').textContent  = pend;
  document.getElementById('st-conc').textContent  = conc;
  document.getElementById('totalInscritos').textContent   = tot;
  document.getElementById('totalConfirmados').textContent = conf;
  document.getElementById('totalProximos').textContent    = pend;
}

/* =====================================================
   SENHA
   ===================================================== */
function togglePass(inputId, iconId) {
  const inp  = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  const vis  = inp.type === 'text';
  inp.type   = vis ? 'password' : 'text';
  icon.className = vis ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill';
}

function avaliarSenha(inp) {
  const v = inp.value;
  let pts = 0;
  if (v.length >= 8)           pts++;
  if (/[A-Z]/.test(v))         pts++;
  if (/[0-9]/.test(v))         pts++;
  if (/[^a-zA-Z0-9]/.test(v))  pts++;
  const cores  = ['#ef4444','#f97316','#eab308','#22c55e'];
  const labels = ['Fraca','Regular','Boa','Forte'];
  for (let i=1;i<=4;i++) {
    document.getElementById(`sb${i}`).style.background = i<=pts ? cores[pts-1] : '#e5e7eb';
  }
  const lbl = document.getElementById('slabel');
  lbl.textContent = pts>0 ? labels[pts-1] : '';
  lbl.style.color = pts>0 ? cores[pts-1] : 'var(--muted)';
}

function salvarSenha() {
  const atual = document.getElementById('senhaAtual').value;
  const nova  = document.getElementById('senhaNova').value;
  const conf  = document.getElementById('senhaConf').value;

  if (!atual || !nova || !conf) { showToast('Preencha todos os campos.', true); return; }
  if (nova.length < 8)          { showToast('A nova senha deve ter no mínimo 8 caracteres.', true); return; }
  if (nova !== conf)             { showToast('As senhas não coincidem.', true); return; }

  document.getElementById('senhaAtual').value = '';
  document.getElementById('senhaNova').value  = '';
  document.getElementById('senhaConf').value  = '';
  showToast('Senha atualizada com sucesso!');
}

/* =====================================================
   EXCLUIR CONTA
   ===================================================== */
function excluirConta() {
  const inp = document.getElementById('inputConfExcluir').value.trim();
  if (inp !== 'EXCLUIR') { showToast('Digite EXCLUIR para confirmar.', true); return; }
  Auth.logout();
}

/* =====================================================
   MÁSCARAS
   ===================================================== */
function maskTel(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length<=10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  else              v = v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
  el.value = v;
}
function maskCEP(el) {
  let v = el.value.replace(/\D/g,'').slice(0,8);
  el.value = v.replace(/(\d{5})(\d{1,3})/,'$1-$2');
}

/* =====================================================
   TOAST
   ===================================================== */
let toastTimer;
function showToast(msg, erro=false) {
  const t = document.getElementById('toast');
  const i = t.querySelector('i');
  document.getElementById('toastMsg').textContent = msg;
  t.style.borderLeftColor = erro ? '#ef4444' : '#22c55e';
  i.className = erro ? 'bi bi-x-circle-fill' : 'bi bi-check-circle-fill';
  i.style.color = erro ? '#ef4444' : '#22c55e';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}