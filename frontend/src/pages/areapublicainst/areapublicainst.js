import { authService } from '../../core/auth/auth-service.js';
import { apiFetch } from '../../core/api/client.js';

const Auth = authService;

const instituicao = {
  fantasia: 'Instituição',
  razaoSocial: 'Não informado',
  tipo: 'Instituição',
  area: 'Eventos',
  cidade: 'Não informado',
  estado: '',
  desc: 'Esta instituição publica eventos na plataforma EventoCom.',
  membro: 'Não informado',
  links: [],
  totalEventos: 0,
  totalInscritos: 0,
  totalRealizados: 0,
  avatar_data: '',
};

let eventos = [];

/* =====================================================
   INIT
   ===================================================== */
;(async function init() {
  Auth.restore();

  /* Navbar dinâmica */
  const user = Auth.getUser();
  const nav  = document.getElementById('navAcoes');

  const firstName = String(user?.nome || user?.email || 'Usuário').split(' ')[0];
  const userInitials = String(user?.nome || user?.email || 'US')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || 'US';
  const userAvatarHtml = user?.avatar_data
    ? `<span class="nav-user-avatar"><img src="${escapeHtml(user.avatar_data)}" alt="Avatar de ${escapeHtml(firstName)}"/></span>`
    : `<span class="nav-user-avatar">${escapeHtml(userInitials)}</span>`;

  if (!user) {
    nav.innerHTML = `
      <a href="../login/login.html" class="btn-nav-login">
        <i class="bi bi-box-arrow-in-right me-1"></i>Entrar
      </a>
      <a href="../criarevento.html/evento.html" class="btn-nav-create">
        <i class="bi bi-plus-circle me-1"></i>Crie seu Evento
      </a>`;
    document.getElementById('visitorNotice').classList.remove('d-none');
  } else if (user.tipo === 'pj') {
    nav.innerHTML = `
      <span class="nav-user-chip">
        ${userAvatarHtml}
        <strong style="color:#fff;">${escapeHtml(firstName)}</strong>
      </span>
      <a href="../criarevento.html/evento.html" class="btn-nav-create">
        <i class="bi bi-plus-circle me-1"></i>Novo Evento
      </a>`;
  } else {
    nav.innerHTML = `
      <span class="nav-user-chip">
        ${userAvatarHtml}
        <strong style="color:#fff;">${escapeHtml(firstName)}</strong>
      </span>
      <button class="btn-nav-login" id="navLogoutBtn" type="button" style="border:1.5px solid rgba(255,255,255,.3);border-radius:8px;padding:7px 16px;cursor:pointer;font-family:var(--font-body);font-weight:600;font-size:.85rem;color:rgba(255,255,255,.75);background:transparent;transition:all .2s;">
        <i class="bi bi-box-arrow-right me-1"></i>Sair
      </button>`;
  }

  document.getElementById('navLogoutBtn')?.addEventListener('click', logout);

  /* Breadcrumb */
  const params = new URLSearchParams(window.location.search);
  const instId = Number(params.get('inst'));

  if (Number.isFinite(instId) && instId > 0) {
    await carregarInstituicao(instId);
  }

  applyInstituicaoData();
  renderEventos();

  /* Preenche nome no form de contato se logado */
  if (user && user.nome) {
    const inp = document.getElementById('c-nome');
    if (inp) inp.value = user.nome;
  }
})();

async function carregarInstituicao(instId) {
  try {
    const data = await apiFetch(`/events?organizador_id=${encodeURIComponent(instId)}`);
    const apiEvents = Array.isArray(data?.events) ? data.events : [];
    eventos = apiEvents;

    if (apiEvents.length > 0) {
      const primeiro = apiEvents[0];
      instituicao.fantasia = primeiro.organizador_nome || instituicao.fantasia;
      instituicao.razaoSocial = primeiro.organizador_nome || instituicao.razaoSocial;
      instituicao.avatar_data = primeiro.organizador_avatar_data || '';
      instituicao.cidade = primeiro.cidade || instituicao.cidade;
      instituicao.estado = primeiro.estado || instituicao.estado;
      instituicao.totalEventos = apiEvents.length;
      instituicao.totalInscritos = apiEvents.reduce((acc, ev) => acc + Number(ev?.inscritos_count || 0), 0);
      instituicao.totalRealizados = apiEvents.filter((ev) => {
        if (!ev?.data_inicio) return false;
        const d = new Date(ev.data_inicio);
        return !Number.isNaN(d.getTime()) && d < new Date();
      }).length;
    }
  } catch (error) {
    console.warn('Não foi possível carregar dados da instituição.', error);
  }
}

function applyInstituicaoData() {
  document.getElementById('bcNome').textContent = instituicao.fantasia;

  const initials = String(instituicao.fantasia || 'IN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || 'IN';

  const logoInitials = document.getElementById('logoInitials');
  const logoImg = document.getElementById('logoImg');

  if (instituicao.avatar_data) {
    logoImg.src = instituicao.avatar_data;
    logoImg.style.display = 'block';
    logoInitials.style.display = 'none';
  } else {
    logoInitials.textContent = initials;
    logoInitials.style.display = 'inline';
    logoImg.style.display = 'none';
  }

  document.getElementById('instFantasia').textContent = instituicao.fantasia;
  document.getElementById('instRazao').textContent = instituicao.razaoSocial;
  document.getElementById('modalDestino').textContent = instituicao.fantasia;

  const local = [instituicao.cidade, instituicao.estado].filter(Boolean).join(' - ') || 'Não informado';
  document.getElementById('headerTags').innerHTML = `
    <span class="header-tag tag-tipo"><i class="bi bi-tags-fill"></i>${escapeHtml(instituicao.tipo)}</span>
    <span class="header-tag tag-area"><i class="bi bi-grid-fill"></i>${escapeHtml(instituicao.area)}</span>
    <span class="header-tag tag-local"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(local)}</span>
    <span class="header-tag tag-membro"><i class="bi bi-calendar-check-fill"></i>Desde ${escapeHtml(instituicao.membro)}</span>`;

  document.getElementById('instDesc').textContent = instituicao.desc;

  document.getElementById('linksContainer').innerHTML = '<p style="font-family:var(--font-body);font-size:.85rem;color:var(--muted);">Nenhum link cadastrado.</p>';

  document.getElementById('si-tipo').textContent = instituicao.tipo;
  document.getElementById('si-area').textContent = instituicao.area;
  document.getElementById('si-local').textContent = local;
  document.getElementById('si-membro').textContent = instituicao.membro;
  document.getElementById('si-eventos').textContent = instituicao.totalEventos;
  document.getElementById('si-inscritos').textContent = instituicao.totalInscritos;
  document.getElementById('si-realizados').textContent = instituicao.totalRealizados;

  document.title = instituicao.fantasia + ' – EventoCom';
}

/* =====================================================
   RENDER EVENTOS
   ===================================================== */
function renderEventos() {
  const grid  = document.getElementById('eventosGrid');
  const empty = document.getElementById('emptyEventos');
  document.getElementById('contadorEventos').textContent = eventos.length + ' evento(s) publicado(s)';

  if (!eventos.length) {
    grid.classList.add('d-none');
    empty.classList.remove('d-none');
    return;
  }

  grid.innerHTML = eventos.map(ev => {
    const data = parseDate(ev.data_inicio);
    const dia = data ? String(data.getDate()).padStart(2, '0') : '—';
    const mes = data ? data.toLocaleString('pt-BR', { month: 'short' }) : '—';
    const dataFull = data ? formatDate(data) : 'Data não informada';
    const hora = ev.hora_inicio ? `${ev.hora_inicio}${ev.hora_fim ? ` às ${ev.hora_fim}` : ''}` : 'Horário não informado';
    const local = ev.formato === 'online' ? 'Online' : [ev.local_nome, ev.cidade, ev.estado].filter(Boolean).join(', ');
    const entradaGratis = !ev.entrada || String(ev.entrada).toLowerCase() === 'gratuito';
    const valor = entradaGratis ? 'Gratuito' : String(ev.valor || 'Pago');
    const imagem = ev.imagem_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80';

    return `
    <div class="ev-card">
      <div class="ev-thumb">
        <img src="${imagem}" alt="${escapeHtml(ev.nome || 'Evento')}" loading="lazy"/>
        <div class="ev-date-badge">
          <span class="day">${dia}</span>
          <span class="mon">${mes}</span>
        </div>
        <span class="ev-cat-badge">${escapeHtml(ev.categoria || 'Evento')}</span>
      </div>
      <div class="ev-body">
        <h6 class="ev-name">${escapeHtml(ev.nome || 'Evento')}</h6>
        <p class="ev-meta"><i class="bi bi-calendar3"></i>${escapeHtml(dataFull)}</p>
        <p class="ev-meta"><i class="bi bi-clock-fill"></i>${escapeHtml(hora)}</p>
        <p class="ev-meta"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(local || 'Local não informado')}</p>
        <p class="ev-meta"><i class="bi bi-display"></i>${escapeHtml(ev.formato || 'Presencial')}</p>
      </div>
      <div class="ev-footer">
        <span class="ev-entrada ${entradaGratis ? 'entrada-gratis' : 'entrada-pago'}">
          ${escapeHtml(valor)}
        </span>
        <a href="../home/home.html" class="btn-ver-ev">
          Ver evento <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
    </div>`;
  }).join('');
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* =====================================================
   CONTATO
   ===================================================== */
function enviarContato() {
  const nome     = document.getElementById('c-nome').value.trim();
  const email    = document.getElementById('c-email').value.trim();
  const assunto  = document.getElementById('c-assunto').value.trim();
  const mensagem = document.getElementById('c-mensagem').value.trim();

  if (!nome || !email || !assunto || !mensagem) {
    alert('Por favor, preencha todos os campos antes de enviar.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Informe um e-mail válido.');
    return;
  }

  /* Simula envio — substituir por fetch real */
  document.getElementById('contatoForm').style.display   = 'none';
  document.getElementById('contatoSuccess').style.display = 'block';
  document.getElementById('contatoFooter').innerHTML =
    `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" id="btnContatoFechar">Fechar</button>`;
  bindContatoFooterEvents();
}

function resetContato() {
  document.getElementById('contatoForm').style.display   = 'block';
  document.getElementById('contatoSuccess').style.display = 'none';
  document.getElementById('contatoFooter').innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
    <button type="button" class="btn-enviar" id="btnEnviarContato">
      <i class="bi bi-send-fill"></i>Enviar mensagem
    </button>`;
  bindContatoFooterEvents();
  document.getElementById('c-assunto').value  = '';
  document.getElementById('c-mensagem').value = '';
}

function bindContatoFooterEvents() {
  document.getElementById('btnEnviarContato')?.addEventListener('click', enviarContato);
  document.getElementById('btnContatoFechar')?.addEventListener('click', resetContato);
}

function logout() {
  authService.logout();
}

/* Reseta o modal ao fechar */
document.getElementById('modalContato').addEventListener('hidden.bs.modal', resetContato);
bindContatoFooterEvents();
