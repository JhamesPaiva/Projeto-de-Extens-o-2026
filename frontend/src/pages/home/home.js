document.addEventListener('DOMContentLoaded', function() {
  updateNavbarAuthState();
  loadEvents();

  const eventModal = document.getElementById('eventModal');
  if (eventModal) {
    eventModal.addEventListener('show.bs.modal', function (event) {
      const button = event.relatedTarget;
      const nome = button.getAttribute('data-nome');
      const data = button.getAttribute('data-data');
      const hora = button.getAttribute('data-hora');
      const local = button.getAttribute('data-local');
      const inst = button.getAttribute('data-inst');
      const desc = button.getAttribute('data-desc');
      const cardImg = button.closest('.card').querySelector('.event-card-img').src;

      document.getElementById('modalNome').textContent = nome;
      document.getElementById('modalData').textContent = data;
      document.getElementById('modalHora').textContent = hora;
      document.getElementById('modalLocal').textContent = local;
      document.getElementById('modalInst').textContent = inst;
      document.getElementById('modalDesc').textContent = desc;
      document.getElementById('modalImg').src = cardImg;
    });
  }
});

function updateNavbarAuthState() {
  const user = Auth.getUser();
  const navActions = document.querySelector('.navbar .d-flex');
  if (!navActions) return;

  if (!user) {
    return;
  }

  const userTipo = String(user.tipo || '').trim().toLowerCase();

  const firstName = String(user.nome || user.email || 'Usuário').split(' ')[0];
  const areaLink = userTipo === 'pj'
    ? '../areausuarioinstituição/areausuarioinst.html'
    : '../areausuariofisico/areausuario.html';

  const createEventButton = userTipo === 'pj'
    ? `<a href="../criarevento.html/evento.html" class="btn btn-nav-create">
      <i class="bi bi-plus-circle me-1"></i>Crie seu Evento
    </a>`
    : '';

  navActions.innerHTML = `
    <span class="me-2 d-flex align-items-center text-white">Olá, ${escapeHtml(firstName)}!</span>
    <a href="${areaLink}" class="btn btn-nav-register">
      <i class="bi bi-person-circle me-1"></i>Minha Área
    </a>
    <button type="button" class="btn btn-nav-login" onclick="Auth.logout()">
      <i class="bi bi-box-arrow-right me-1"></i>Sair
    </button>
    ${createEventButton}
  `;
}


async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  const countEl = document.getElementById('eventCount');

  if (!grid) return;

  try {
    const data = await apiFetch('/events');
    const events = Array.isArray(data.events) ? data.events : [];

    if (countEl) {
      countEl.textContent = `${events.length} evento${events.length === 1 ? '' : 's'} encontrados`;
    }

    if (events.length === 0) {
      grid.innerHTML = `<div class="col-12"><div class="alert alert-info">Nenhum evento encontrado no momento.</div></div>`;
      return;
    }

    grid.innerHTML = events.map(eventToCard).join('');
  } catch (error) {
    if (countEl) countEl.textContent = 'Falha ao carregar eventos';
    grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Não foi possível carregar os eventos agora.</div></div>`;
    console.error(error);
  }
}

function eventToCard(event) {
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

  return `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="event-card card">
        <div class="card-img-wrap">
          <img class="event-card-img" src="${escapeHtml(imagem)}" alt="${escapeHtml(cat)}" />
          <div class="date-badge">
            <span class="day">${dia}</span>
            <span class="mon">${mes}</span>
          </div>
        </div>
        <div class="card-body">
          <h5 class="event-name">${escapeHtml(event.nome)}</h5>
          <p class="event-location"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(local)}</p>
          <p class="event-time"><i class="bi bi-clock-fill"></i>${escapeHtml(hora)}</p>
        </div>
        <div class="card-footer-custom">
          <span class="badge badge-categoria text-bg-${catCor}">${escapeHtml(cat)}</span>
          <button class="btn-ver-mais" onclick="abrirModal({ img:'${escapeHtml(imagem)}', nome:'${escapeHtml(event.nome)}', cat:'${escapeHtml(cat)}', catCor:'${catCor}', data:'${escapeHtml(dataFull)}', hora:'${escapeHtml(hora)}', local:'${escapeHtml(local)}', formato:'${escapeHtml(event.formato || 'Presencial')}', entrada:'${escapeHtml(event.entrada || 'Informação indisponível')}', idade:'${escapeHtml(event.idade || 'Livre')}', desc:'${escapeHtml(desc)}' })">
            Ver mais <i class="bi bi-arrow-right-short"></i>
          </button>
        </div>
      </div>
    </div>`;
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
