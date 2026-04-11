import { authService } from '../../core/auth/auth-service.js';
import { apiFetch } from '../../core/api/client.js';
import { HOME_DEMO_EVENTS } from './demo-events.js';

let selectedEventId = null;
let selectedEventIsDemo = false;
let modalInstance = null;
let searchDebounceTimer = null;

const subscribedEventIds = new Set();
const subscriptionStatusByEvent = new Map();
const renderedEventsByKey = new Map();

document.addEventListener('DOMContentLoaded', () => {
  setupModalControls();
  setupSearchControls();
  updateNavbarAuthState();
  loadEvents();
  loadMySubscribedEventIds();
});

function setupModalControls() {
  const modalEl = document.getElementById('modalEvento');
  if (!modalEl) return;

  modalInstance = new bootstrap.Modal(modalEl);

  document.getElementById('m-btn-fechar-top')?.addEventListener('click', closeModal);
  document.getElementById('m-btn-fechar-footer')?.addEventListener('click', closeModal);
  document.getElementById('m-btn-inscricao')?.addEventListener('click', handleSubscribeClick);

  modalEl.addEventListener('hidden.bs.modal', () => {
    selectedEventId = null;
    selectedEventIsDemo = false;
  });

  document.getElementById('eventsGrid')?.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-event]');
    if (!trigger) return;
    const key = trigger.getAttribute('data-event-key');
    const eventData = renderedEventsByKey.get(key);
    if (!eventData) return;
    openEventModal(eventData);
  });
}

function setupSearchControls() {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const filterIds = ['filterCidade', 'filterCategoria', 'filterData', 'filterFormato', 'filterEntrada', 'filterIdade'];

  if (searchButton) {
    searchButton.addEventListener('click', () => {
      loadEvents();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadEvents();
      }
    });

    searchInput.addEventListener('input', () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        loadEvents();
      }, 320);
    });
  }

  for (const id of filterIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', () => {
      loadEvents();
    });
  }
}

function getSearchFilters() {
  return {
    search: (document.getElementById('searchInput')?.value || '').trim(),
    cidade: (document.getElementById('filterCidade')?.value || '').trim(),
    categoria: (document.getElementById('filterCategoria')?.value || '').trim(),
    data: (document.getElementById('filterData')?.value || '').trim(),
    formato: (document.getElementById('filterFormato')?.value || '').trim(),
    entrada: (document.getElementById('filterEntrada')?.value || '').trim(),
    idade: (document.getElementById('filterIdade')?.value || '').trim(),
  };
}

async function loadMySubscribedEventIds() {
  const user = authService.getUser();
  const tipo = String(user?.tipo || '').toLowerCase();
  if (!user || tipo !== 'pf' || !authService.restore()) return;

  try {
    const data = await apiFetch('/my-subscriptions');
    const events = Array.isArray(data?.events) ? data.events : [];
    subscribedEventIds.clear();
    subscriptionStatusByEvent.clear();
    for (const ev of events) {
      const id = Number(ev?.id);
      if (!Number.isFinite(id) || id <= 0) continue;

      const statusRaw = String(ev?.subscription_status || '').toLowerCase();
      const status = statusRaw || 'confirmado';
      subscriptionStatusByEvent.set(id, status);

      if (status === 'confirmado') {
        subscribedEventIds.add(id);
      }
    }
    await loadEvents();
    updateSubscribeButtonState();
  } catch (error) {
    console.warn('Não foi possível carregar inscrições do usuário na Home.', error);
  }
}

function updateNavbarAuthState() {
  const user = authService.getUser();
  const navActions = document.querySelector('.navbar .d-flex');
  if (!navActions) return;

  if (!user) {
    return;
  }

  const userTipo = String(user.tipo || '').trim().toLowerCase();

  const firstName = String(user.nome || user.email || 'Usuário').split(' ')[0];
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
    ? `<a href="../criarevento.html/evento.html" class="btn btn-nav-create">
      <i class="bi bi-plus-circle me-1"></i>Crie seu Evento
    </a>`
    : '';

  navActions.innerHTML = `
    <span class="nav-user-chip text-white">${avatarHtml}<span>Olá, ${escapeHtml(firstName)}!</span></span>
    <a href="${areaLink}" class="btn btn-nav-register">
      <i class="bi bi-person-circle me-1"></i>Minha Área
    </a>
    <button type="button" id="homeLogoutBtn" class="btn btn-nav-login">
      <i class="bi bi-box-arrow-right me-1"></i>Sair
    </button>
    ${createEventButton}
  `;

  document.getElementById('homeLogoutBtn')?.addEventListener('click', () => authService.logout());
}


async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  const countEl = document.getElementById('eventCount');

  if (!grid) return;

  try {
    const filters = getSearchFilters();
    const demoEvents = applyFiltersToDemoEvents(filters);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.cidade) params.set('cidade', filters.cidade);
    if (filters.categoria) params.set('categoria', filters.categoria);
    if (filters.formato) params.set('formato', filters.formato);
    if (filters.entrada) params.set('entrada', filters.entrada);
    if (filters.data) params.set('data', filters.data);
    if (filters.idade) params.set('idade', filters.idade);

    if (countEl) countEl.textContent = 'Carregando eventos...';

    const endpoint = params.toString() ? `/events?${params.toString()}` : '/events';
    const data = await apiFetch(endpoint);
    const apiEvents = Array.isArray(data.events) ? data.events : [];
    const events = sortEventsByDateAsc([...apiEvents, ...demoEvents]);

    if (countEl) {
      countEl.textContent = `${events.length} evento${events.length === 1 ? '' : 's'} encontrados`;
    }

    if (events.length === 0) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-info">Nenhum evento encontrado no momento.</div></div>`;
      return;
    }

    renderedEventsByKey.clear();
    grid.innerHTML = events.map(eventToCard).join('');
  } catch (error) {
    const filters = getSearchFilters();
    const demoEvents = applyFiltersToDemoEvents(filters);
    if (demoEvents.length > 0) {
      if (countEl) {
        countEl.textContent = `${demoEvents.length} evento${demoEvents.length === 1 ? '' : 's'} encontrados (modo demonstração)`;
      }
      renderedEventsByKey.clear();
      grid.innerHTML = sortEventsByDateAsc(demoEvents).map(eventToCard).join('');
    } else {
      if (countEl) countEl.textContent = 'Falha ao carregar eventos';
      grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Não foi possível carregar os eventos agora.</div></div>`;
    }
    console.error(error);
  }
}

function eventToCard(event) {
  const eventId = Number(event.id) || 0;
  const isDemo = Boolean(event.is_demo);
  const data = parseDate(event.data_inicio);
  const dia = data ? String(data.getDate()).padStart(2, '0') : '—';
  const mes = data ? data.toLocaleString('pt-BR', { month: 'short' }) : '—';
  const dataFull = data ? formatFullDate(event.data_inicio) : 'Data não informada';
  const hora = event.hora_inicio ? `${event.hora_inicio}${event.hora_fim ? ` às ${event.hora_fim}` : ''}` : 'Horário não informado';
  const local = event.formato === 'online' ? 'Online' : [event.local_nome, event.cidade, event.estado].filter(Boolean).join(', ');
  const imagem = event.imagem_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80';
  const cat = event.categoria || 'Evento';
  const catCor = badgeColor(event.categoria);
  const desc = event.descricao || 'Veja mais detalhes do evento.';
  const subscriptionStatus = subscriptionStatusByEvent.get(eventId) || '';
  const inscrito = subscribedEventIds.has(eventId);
  const organizadorNome = event.organizador_nome || 'Instituição';
  const organizadorIniciais = String(organizadorNome)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || 'IN';
  const organizadorAvatar = event.organizador_avatar_data
    ? `<span class="event-org-avatar"><img src="${escapeHtml(event.organizador_avatar_data)}" alt="Instituição ${escapeHtml(organizadorNome)}"/></span>`
    : `<span class="event-org-avatar">${escapeHtml(organizadorIniciais)}</span>`;
  const perfilInstituicaoUrl = `../areapublicainst/areapublicainst.html?inst=${encodeURIComponent(Number(event.organizador_id) || 0)}`;
  const entradaTexto = event.entrada_label || formatEntrada(event.entrada);

  const key = `${isDemo ? 'd' : 'r'}:${eventId}`;
  renderedEventsByKey.set(key, {
    id: eventId,
    isDemo,
    img: imagem,
    nome: event.nome,
    cat,
    catCor,
    data: dataFull,
    hora,
    local,
    formato: event.formato || 'Presencial',
    entrada: entradaTexto || 'Informação indisponível',
    idade: event.idade || 'Livre',
    desc,
    orgNome: organizadorNome,
    orgAvatar: event.organizador_avatar_data || '',
    orgId: Number(event.organizador_id) || 0,
  });

  return `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="event-card card">
        <div class="card-img-wrap">
          <img class="event-card-img" src="${escapeHtml(imagem)}" alt="${escapeHtml(cat)}" />
          <div class="date-badge">
            <span class="day">${dia}</span>
            <span class="mon">${mes}</span>
          </div>
          ${inscrito ? '<span class="inscrito-badge"><i class="bi bi-check2-circle"></i>Inscrito</span>' : ''}
        </div>
        <div class="card-body">
          <h5 class="event-name">${escapeHtml(event.nome)}</h5>
          <div class="event-org">${organizadorAvatar}<a class="event-org-name event-org-link" href="${perfilInstituicaoUrl}" title="Ver perfil público da instituição">${escapeHtml(organizadorNome)}</a></div>
          <p class="event-location"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(local)}</p>
          <p class="event-time"><i class="bi bi-clock-fill"></i>${escapeHtml(hora)}</p>
        </div>
        <div class="card-footer-custom">
          <span class="badge badge-categoria text-bg-${catCor}">${escapeHtml(cat)}</span>
          <button class="btn-ver-mais" data-open-event="1" data-event-key="${key}">
            Ver mais <i class="bi bi-arrow-right-short"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function updateSubscribeButtonState() {
  const btn = document.getElementById('m-btn-inscricao');
  if (!btn) return;

  const user = authService.getUser();
  const tipo = String(user?.tipo || '').toLowerCase();

  btn.disabled = false;
  btn.classList.remove('btn-cancelar-inscricao');
  btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Quero participar';

  if (selectedEventIsDemo) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-info-circle me-2"></i>Evento demonstrativo';
    return;
  }

  if (!user) {
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Entrar para participar';
    return;
  }

  if (tipo !== 'pf') {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-lock-fill me-2"></i>Disponível para PF';
    return;
  }

  if (selectedEventId && subscribedEventIds.has(Number(selectedEventId))) {
    btn.disabled = false;
    btn.classList.add('btn-cancelar-inscricao');
    btn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Cancelar inscrição';
    return;
  }

  const statusAtual = subscriptionStatusByEvent.get(Number(selectedEventId));
  if (statusAtual === 'pendente_pagamento') {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-credit-card me-2"></i>Concluir pagamento';
  }
};

async function cancelarInscricaoNoEvento() {
  const btn = document.getElementById('m-btn-inscricao');

  if (!selectedEventId) {
    showMiniFeedback('Não foi possível identificar o evento.', true);
    return;
  }

  if (!window.confirm('Deseja realmente cancelar sua inscrição neste evento?')) {
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Cancelando...';
    }

    await apiFetch(`/events/${selectedEventId}/subscribe`, { method: 'DELETE' });
    subscribedEventIds.delete(Number(selectedEventId));
    subscriptionStatusByEvent.delete(Number(selectedEventId));
    showMiniFeedback('Inscrição cancelada com sucesso!');
    updateSubscribeButtonState();
    await loadEvents();
  } catch (error) {
    const msg = error?.payload?.message || error?.message || 'Não foi possível cancelar sua inscrição.';
    showMiniFeedback(msg, true);
    updateSubscribeButtonState();
  }
}

async function confirmarPagamentoNoEvento() {
  const btn = document.getElementById('m-btn-inscricao');

  if (!selectedEventId) {
    showMiniFeedback('Não foi possível identificar o evento.', true);
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Confirmando pagamento...';
    }

    await apiFetch(`/events/${selectedEventId}/subscribe/confirm-payment`, { method: 'POST' });
    subscriptionStatusByEvent.set(Number(selectedEventId), 'confirmado');
    subscribedEventIds.add(Number(selectedEventId));
    showMiniFeedback('Pagamento confirmado e inscrição efetivada!');
    updateSubscribeButtonState();
    await loadEvents();
  } catch (error) {
    const msg = error?.payload?.message || error?.message || 'Não foi possível confirmar o pagamento.';
    showMiniFeedback(msg, true);
    updateSubscribeButtonState();
  }
}

async function handleSubscribeClick() {
  const btn = document.getElementById('m-btn-inscricao');
  const user = authService.getUser();

  if (selectedEventIsDemo) {
    showMiniFeedback('Este é um evento demonstrativo. A inscrição não está disponível.', true);
    return;
  }

  if (!user) {
    showMiniFeedback('Faça login para se inscrever.', true);
    window.location.href = '../login/login.html';
    return;
  }

  if (!authService.restore()) {
    showMiniFeedback('Sua sessão expirou. Faça login novamente.', true);
    window.location.href = '../login/login.html';
    return;
  }

  if (String(user.tipo || '').toLowerCase() !== 'pf') {
    showMiniFeedback('A inscrição está disponível apenas para usuários PF.', true);
    return;
  }

  if (!selectedEventId) {
    showMiniFeedback('Não foi possível identificar o evento.', true);
    return;
  }

  if (subscribedEventIds.has(Number(selectedEventId))) {
    await cancelarInscricaoNoEvento();
    return;
  }

  if (subscriptionStatusByEvent.get(Number(selectedEventId)) === 'pendente_pagamento') {
    await confirmarPagamentoNoEvento();
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Inscrevendo...';
    }

    const response = await apiFetch(`/events/${selectedEventId}/subscribe`, { method: 'POST' });
    const status = String(response?.status || '').toLowerCase();

    if (status === 'pendente_pagamento') {
      subscriptionStatusByEvent.set(Number(selectedEventId), 'pendente_pagamento');
      showMiniFeedback('Inscrição pendente. Clique novamente para confirmar o pagamento.');
    } else {
      subscriptionStatusByEvent.set(Number(selectedEventId), 'confirmado');
      subscribedEventIds.add(Number(selectedEventId));
      showMiniFeedback('Inscrição confirmada com sucesso!');
    }

    if (btn) {
      updateSubscribeButtonState();
    }

    await loadEvents();
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.payload?.message || error?.message || 'Não foi possível concluir sua inscrição.';

    if (status === 409) {
      const subscriptionStatus = String(error?.payload?.status || '').toLowerCase();
      if (subscriptionStatus === 'pendente_pagamento') {
        subscriptionStatusByEvent.set(Number(selectedEventId), 'pendente_pagamento');
      } else {
        subscriptionStatusByEvent.set(Number(selectedEventId), 'confirmado');
        subscribedEventIds.add(Number(selectedEventId));
      }
    }

    if (btn) updateSubscribeButtonState();
    showMiniFeedback(msg, true);
  }
}

function openEventModal(ev) {
  selectedEventIsDemo = Boolean(ev?.isDemo);
  selectedEventId = selectedEventIsDemo ? null : (Number(ev?.id) || null);

  document.getElementById('m-img').src = ev.img;
  document.getElementById('m-nome').textContent = ev.nome;
  document.getElementById('m-data').textContent = ev.data;
  document.getElementById('m-hora').textContent = ev.hora;
  document.getElementById('m-local').textContent = ev.local;
  document.getElementById('m-formato').textContent = ev.formato;
  document.getElementById('m-entrada').textContent = ev.entrada;
  document.getElementById('m-idade').textContent = ev.idade;
  document.getElementById('m-desc').textContent = ev.desc;

  const orgNome = String(ev.orgName || ev.orgNome || 'Instituição');
  const orgIniciais = orgNome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((piece) => piece[0] || '')
    .join('')
    .toUpperCase() || 'IN';

  const orgAvatarEl = document.getElementById('m-org-avatar');
  const orgLinkEl = document.getElementById('m-org-link');
  orgLinkEl.textContent = orgNome;

  const orgId = Number(ev.orgId) || 0;
  orgLinkEl.href = orgId > 0
    ? `../areapublicainst/areapublicainst.html?inst=${encodeURIComponent(orgId)}`
    : '#';

  if (ev.orgAvatar) {
    orgAvatarEl.innerHTML = `<img src="${escapeHtml(ev.orgAvatar)}" alt="Instituição ${escapeHtml(orgNome)}"/>`;
  } else {
    orgAvatarEl.textContent = orgIniciais;
  }

  const catEl = document.getElementById('m-cat');
  catEl.textContent = ev.cat;
  catEl.className = `badge position-absolute bottom-0 start-0 m-3 fs-6 text-bg-${ev.catCor}`;

  modalInstance?.show();
  updateSubscribeButtonState();
}

function closeModal() {
  modalInstance?.hide();
}

function showMiniFeedback(message, isError = false) {
  let el = document.getElementById('home-mini-feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'home-mini-feedback';
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.zIndex = '9999';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '10px';
    el.style.color = '#fff';
    el.style.fontFamily = "'DM Sans', sans-serif";
    el.style.fontSize = '0.86rem';
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,.22)';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all .2s ease';
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.background = isError ? '#dc2626' : '#16a34a';
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';

  window.clearTimeout(showMiniFeedback._timer);
  showMiniFeedback._timer = window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
  }, 2400);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFullDate(value) {
  const date = parseDate(value);
  if (!date) return 'Data não informada';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function badgeColor(categoria) {
  const value = String(categoria || '').toLowerCase();
  if (value.includes('música') || value.includes('musica')) return 'warning';
  if (value.includes('gastronomia')) return 'danger';
  if (value.includes('esportes') || value.includes('esporte')) return 'success';
  if (value.includes('arte') || value.includes('cultura')) return 'info';
  if (value.includes('tecnologia') || value.includes('tech')) return 'dark';
  if (value.includes('saúde') || value.includes('saude')) return 'secondary';
  return 'primary';
}

function formatEntrada(entrada) {
  const value = String(entrada || '').trim().toLowerCase();
  if (value === 'gratuito') return 'Gratuito';
  if (value === 'pago') return 'Pago';
  return entrada || 'Informação indisponível';
}

function applyFiltersToDemoEvents(filters) {
  return HOME_DEMO_EVENTS.filter((event) => {
    if (filters.search) {
      const q = normalizeStr(filters.search);
      const haystack = normalizeStr([
        event.nome,
        event.descricao,
        event.categoria,
        event.local_nome,
        event.cidade,
        event.estado,
        event.organizador_nome,
      ].join(' '));
      if (!haystack.includes(q)) return false;
    }

    if (filters.cidade && normalizeStr(event.cidade) !== normalizeStr(filters.cidade)) return false;
    if (filters.categoria && normalizeStr(event.categoria) !== normalizeStr(filters.categoria)) return false;
    if (filters.formato && normalizeStr(event.formato) !== normalizeStr(filters.formato)) return false;
    if (filters.entrada && normalizeStr(event.entrada) !== normalizeStr(filters.entrada)) return false;
    if (filters.idade && normalizeStr(event.idade) !== normalizeStr(filters.idade)) return false;
    if (filters.data && !matchesPresetDate(event.data_inicio, filters.data)) return false;

    return true;
  });
}

function matchesPresetDate(value, preset) {
  const date = parseDate(value);
  if (!date) return false;

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const evDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const token = String(preset || '').toLowerCase();
  if (token === 'today') {
    return evDay.getTime() === dayStart.getTime();
  }

  if (token === 'this_week') {
    const weekday = dayStart.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const weekStart = new Date(dayStart);
    weekStart.setDate(dayStart.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return date >= weekStart && date <= weekEnd;
  }

  if (token === 'this_month') {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  if (token === 'next_month') {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear();
  }

  return date >= dayStart && date <= dayEnd;
}

function normalizeStr(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function sortEventsByDateAsc(events) {
  return [...events].sort((a, b) => {
    const aDate = parseDate(a?.data_inicio);
    const bDate = parseDate(b?.data_inicio);
    const aTime = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR');
  });
}
