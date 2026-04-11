let eventosUsuario = [];
let filtroAtualEventos = 'todos';
const EVENTO_IMG_PADRAO = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80';

/* =====================================================
   INICIALIZAÇÃO
   ===================================================== */
;(async function init() {
  if (!Auth.requireAuth()) return;
  const user = Auth.getUser() || {};
  const nome = user.nome || 'Usuário';
  const [primeiroNome, ...rest] = nome.split(' ');
  const sobrenome = rest.join(' ') || '—';
  const membroDesde = user.criado_em ? formatarData(user.criado_em) : '—';

  /* Preenche navbar */
  document.getElementById('navNome').textContent = nome;

  /* Hero */
  document.getElementById('profileName').textContent  = nome;
  document.getElementById('profileEmail').textContent = user.email || '—';
  document.getElementById('avatarInitials').textContent =
    `${(primeiroNome[0] || '').toUpperCase()}${(sobrenome[0] || '').toUpperCase()}`;
  if (user.avatar_data) {
    const avatarImg = document.getElementById('avatarImg');
    avatarImg.src = user.avatar_data;
    avatarImg.style.display = 'block';
    document.getElementById('avatarInitials').style.display = 'none';
  }

  /* Sidebar resumo */
  document.getElementById('membroDesde').textContent = membroDesde;

  /* Campos de dados */
  setField('fv-nome',       nome);
  setField('fv-sobrenome',  sobrenome);
  document.getElementById('fv-cpf-val').textContent = user.cpf || '—';
  setField('fv-nascimento', '—');
  setField('fv-telefone',   user.telefone || '—');
  setField('fv-genero',     'Não informado');
  setField('fv-email',      user.email || '—');
  setField('fv-cep',        user.cep || '—');
  setField('fv-cidade',     user.cidade || '—');
  setField('fv-estado',     user.estado || '—');
  setField('fv-bairro',     '—');

  /* Inputs de edição — preencher com valores atuais */
  val('fi-nome-input',       nome);
  val('fi-sobrenome-input',  sobrenome !== '—' ? sobrenome : '');
  document.getElementById('fv-cpf-val').textContent = user.cpf || '—';
  val('fi-nascimento-input', '');
  val('fi-telefone-input',   user.telefone || '');
  selOpt('fi-genero-input',  '');
  val('fi-email-input',      user.email || '');
  val('fi-cep-input',        user.cep || '');
  val('fi-cidade-input',     user.cidade || '');
  selOpt('fi-estado-input',  user.estado || '');
  val('fi-bairro-input',     '');

  /* Renderiza eventos */
  await carregarMinhasInscricoes();
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

function getStatusEvento(dataIso) {
  if (!dataIso) return 'confirmado';
  const data = new Date(`${String(dataIso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return 'confirmado';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return data < hoje ? 'concluido' : 'confirmado';
}

function formatarDataBadge(dataIso) {
  const data = new Date(`${String(dataIso || '').slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return { dia: '—', mes: '—', dataFull: 'Data não informada' };

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const dataFull = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  return { dia, mes: mes.charAt(0).toUpperCase() + mes.slice(1), dataFull };
}

function normalizarEventoInscrito(ev) {
  const dataInfo = formatarDataBadge(ev?.data_inicio);
  const horaInicio = String(ev?.hora_inicio || '').slice(0, 5);
  const horaFim = String(ev?.hora_fim || '').slice(0, 5);
  const local = String(ev?.formato || '').toLowerCase() === 'online'
    ? 'Online'
    : [ev?.local_nome, ev?.cidade, ev?.estado].filter(Boolean).join(', ') || 'Local a definir';

  return {
    id: Number(ev?.id) || Date.now(),
    nome: ev?.nome || 'Evento sem título',
    categoria: ev?.categoria || 'Evento',
    data: dataInfo.dia,
    mes: dataInfo.mes,
    dataFull: dataInfo.dataFull,
    hora: horaInicio ? `${horaInicio}${horaFim ? ` às ${horaFim}` : ''}` : 'Horário não informado',
    local,
    status: getStatusEvento(ev?.data_inicio),
    img: ev?.imagem_url || EVENTO_IMG_PADRAO,
    formato: ev?.formato || 'Presencial',
    idade: ev?.idade || 'Livre',
    desc: ev?.descricao || 'Descrição não informada.',
  };
}

async function carregarMinhasInscricoes() {
  try {
    const data = await apiFetch('/my-subscriptions');
    const events = Array.isArray(data?.events) ? data.events : [];
    eventosUsuario = events.map(normalizarEventoInscrito);
    aplicarFiltroAtual();
    atualizarStats();
    atualizarRotulosFiltros();
  } catch (error) {
    console.error('Erro ao carregar inscrições do usuário PF:', error);
    eventosUsuario = [];
    aplicarFiltroAtual();
    atualizarStats();
    atualizarRotulosFiltros();
    showToast('Não foi possível carregar seus eventos inscritos.', true);
  }
}

function aplicarFiltroAtual() {
  const filtrados = filtroAtualEventos === 'todos'
    ? eventosUsuario
    : eventosUsuario.filter(e => e.status === filtroAtualEventos);
  renderEventos(filtrados);
}

function atualizarRotulosFiltros() {
  const contagens = {
    todos: eventosUsuario.length,
    confirmado: eventosUsuario.filter(e => e.status === 'confirmado').length,
    pendente: eventosUsuario.filter(e => e.status === 'pendente').length,
    concluido: eventosUsuario.filter(e => e.status === 'concluido').length,
    cancelado: eventosUsuario.filter(e => e.status === 'cancelado').length,
  };

  document.querySelectorAll('.filter-tab[data-filter]').forEach((btn) => {
    const status = btn.getAttribute('data-filter');
    btn.textContent = `${btn.getAttribute('data-label')} (${contagens[status] || 0})`;
  });
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
  reader.onload = async e => {
    const avatarData = e.target.result;
    const img = document.getElementById('avatarImg');
    img.src = avatarData;
    img.style.display = 'block';
    document.getElementById('avatarInitials').style.display = 'none';

    try {
      const response = await apiFetch('/profile/avatar', {
        method: 'PUT',
        body: { avatar_data: avatarData },
      });
      const updatedUser = response?.user || {};
      Auth.updateUser({ avatar_data: updatedUser.avatar_data || avatarData });
      showToast('Foto de perfil atualizada!');
    } catch (error) {
      const msg = error?.payload?.message || error?.message || 'Não foi possível salvar a foto de perfil.';
      showToast(msg, true);
    }
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
        <button class="btn-ev-detalhe" onclick="verDetalhesEvento(${ev.id})">
          <i class="bi bi-eye me-1"></i>Detalhes
        </button>
        <button class="btn-ev-cancelar" onclick="pedirCancelamento(${ev.id}, '${ev.nome.replace(/'/g,"\\'")}')">
          Cancelar
        </button>
      </div>
    </div>`).join('');
}

function filtrarEventos(status, btn) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filtroAtualEventos = status;
  aplicarFiltroAtual();
}

function pedirCancelamento(id, nome) {
  cancelTarget = id;
  document.getElementById('modalEvNome').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalCancelar')).show();
}

async function confirmarCancelamento() {
  if (!cancelTarget) return;
  try {
    await apiFetch(`/events/${cancelTarget}/subscribe`, { method: 'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById('modalCancelar'))?.hide();
    cancelTarget = null;
    await carregarMinhasInscricoes();
    showToast('Inscrição cancelada.');
  } catch (error) {
    const msg = error?.payload?.message || error?.message || 'Não foi possível cancelar a inscrição.';
    showToast(msg, true);
  }
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

let detalhesModalInstance = null;

async function verDetalhesEvento(id) {
  const evento = eventosUsuario.find(e => e.id === id);
  if (!evento) return;

  let detalhes = null;
  try {
    detalhes = await apiFetch(`/events/${id}`);
  } catch (error) {
    console.warn('Não foi possível atualizar detalhes do evento em tempo real.', error);
  }

  const nome = detalhes?.nome || evento.nome;
  const categoria = detalhes?.categoria || evento.categoria;
  const dataFull = detalhes?.data_inicio ? formatarDataBadge(detalhes.data_inicio).dataFull : evento.dataFull;
  const horaIni = String(detalhes?.hora_inicio || '').slice(0, 5);
  const horaFim = String(detalhes?.hora_fim || '').slice(0, 5);
  const hora = horaIni ? `${horaIni}${horaFim ? ` às ${horaFim}` : ''}` : evento.hora;
  const local = String(detalhes?.formato || '').toLowerCase() === 'online'
    ? 'Online'
    : [detalhes?.local_nome, detalhes?.cidade, detalhes?.estado].filter(Boolean).join(', ') || evento.local;
  const formato = detalhes?.formato || evento.formato;
  const idade = detalhes?.idade || evento.idade;
  const desc = detalhes?.descricao || evento.desc;
  const img = detalhes?.imagem_url || evento.img;

  document.getElementById('mdet-img').src = img;
  document.getElementById('mdet-nome').textContent = nome;
  document.getElementById('mdet-cat').textContent = categoria;
  document.getElementById('mdet-data').textContent = dataFull;
  document.getElementById('mdet-hora').textContent = hora;
  document.getElementById('mdet-local').textContent = local;
  document.getElementById('mdet-formato').textContent = formato;
  document.getElementById('mdet-idade').textContent = idade;
  document.getElementById('mdet-desc').textContent = desc;

  const modalEl = document.getElementById('modalDetalhesEvento');
  detalhesModalInstance = new bootstrap.Modal(modalEl);
  detalhesModalInstance.show();
}

function fecharDetalhesEvento() {
  if (detalhesModalInstance) {
    detalhesModalInstance.hide();
  }
}