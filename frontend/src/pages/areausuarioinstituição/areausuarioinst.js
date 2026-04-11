let eventosInst = [];
let filtroAtual = 'todos';
let usuarioInstituicaoId = null;
let imagemEdicaoEvento = '';
const EVENTO_IMG_PADRAO = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80';

/* =====================================================
   INIT
   ===================================================== */
;(async function init() {
  if (!Auth.requireInstituicao()) return;
  const user = Auth.getUser() || {};
  usuarioInstituicaoId = user.id || null;
  const nome = user.nome || 'Instituição';

  document.getElementById('navNome').textContent = nome;

  // Hero
  document.getElementById('instName').textContent    = nome;
  document.getElementById('instFantasia').textContent = nome;
  document.getElementById('logoInitials').textContent =
    nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  if (user.avatar_data) {
    const logoImg = document.getElementById('logoImg');
    logoImg.src = user.avatar_data;
    logoImg.style.display = 'block';
    document.getElementById('logoInitials').style.display = 'none';
  }

  // Preenche campos de exibição
  document.getElementById('fv-razao-val').textContent = nome;
  document.getElementById('fv-cnpj-val').textContent  = user.cnpj || '—';
  document.getElementById('fv-resp-cpf-val').textContent = '—';

  setFV('fv-fantasia',   nome);
  setFV('fv-tipo',       'Instituição');
  setFV('fv-area',       '—');
  setFV('fv-site',       '—');
  setFV('fv-desc',       '—');
  setFV('fv-resp-nome',  '—');
  setFV('fv-resp-cargo', '—');
  setFV('fv-resp-tel',   user.telefone || '—');
  setFV('fv-cep',        user.cep || '—');
  setFV('fv-logr',       '—');
  setFV('fv-num',        '—');
  setFV('fv-cidade',     user.cidade || '—');
  setFV('fv-estado',     user.estado || '—');
  setFV('fv-email',      user.email || '—');

  // Inputs de edição
  setVal('fi-fantasia-input',  nome);
  setVal('fi-desc-input',      '');
  setVal('fi-resp-nome-input', '');
  setVal('fi-resp-cargo-input','');
  setVal('fi-resp-tel-input',  user.telefone || '');
  setVal('fi-cep-input',       user.cep || '');
  setVal('fi-logr-input',      '');
  setVal('fi-num-input',       '');
  setVal('fi-cidade-input',    user.cidade || '');
  setVal('fi-email-input',     user.email || '');
  setSel('fi-tipo-input',      '');
  setSel('fi-area-input',      '');
  setSel('fi-estado-input',    user.estado || '');

  await carregarEventosDaApi(usuarioInstituicaoId);
})();

function setFV(id, v) { const el=document.getElementById(id); if(el) el.textContent=v||'—'; }
function setVal(id,v) { const el=document.getElementById(id); if(el) el.value=v||''; }
function setSel(id,v) {
  const s=document.getElementById(id); if(!s) return;
  for(const o of s.options){ if(o.value===v||o.text===v){s.value=o.value;break;} }
}

async function carregarEventosDaApi(organizadorId) {
  if (!organizadorId) {
    eventosInst = [];
    aplicarFiltroAtual();
    atualizarStats();
    return;
  }

  try {
    const response = await apiFetch(`/events?organizador_id=${encodeURIComponent(organizadorId)}`);
    const events = Array.isArray(response?.events) ? response.events : [];
    eventosInst = events.map(normalizarEventoApi);
  } catch (error) {
    console.error('Erro ao carregar eventos da instituição:', error);
    eventosInst = [];
    showToast('Não foi possível carregar seus eventos agora.', true);
  }

  aplicarFiltroAtual();
  atualizarStats();
}

function normalizarEventoApi(ev) {
  const desc = String(ev?.descricao || '').trim();
  const horaInicio = String(ev?.hora_inicio || '').slice(0, 5);
  const horaFim = String(ev?.hora_fim || '').slice(0, 5);
  const temEntrada = ev?.entrada != null || ev?.valor != null;
  const temInscricoes =
    ev?.inscritos != null ||
    ev?.total_inscritos != null ||
    ev?.inscritos_count != null ||
    ev?.capacidade != null;
  const inscritos = Number(
    ev?.inscritos ?? ev?.total_inscritos ?? ev?.inscritos_count ?? 0,
  );
  const imagemUrlOriginal = typeof ev?.imagem_url === 'string' ? ev.imagem_url.trim() : '';

  return {
    id: Number(ev?.id) || Date.now(),
    nome: ev?.nome || 'Evento sem título',
    categoria: ev?.categoria || '—',
    status: normalizarStatus(ev?.status),
    data: String(ev?.data_inicio || '').slice(0, 10),
    horaIni: horaInicio || '—',
    horaFim: horaFim || '',
    formato: formatarFormato(ev?.formato),
    localNome: ev?.local_nome || 'Local a definir',
    cidade: ev?.cidade || '—',
    estado: ev?.estado || '—',
    entrada: formatarEntrada(ev?.entrada),
    valor: ev?.valor || '—',
    capacidade: Number(ev?.capacidade || 0),
    inscritos: Number.isFinite(inscritos) ? inscritos : 0,
    temEntrada,
    temInscricoes,
    idade: ev?.idade || 'Livre',
    descCurta: desc ? resumirTexto(desc, 150) : 'Sem descrição.',
    desc: desc || 'Sem descrição.',
    imagemUrlOriginal,
    img: imagemUrlOriginal || EVENTO_IMG_PADRAO,
  };
}

function normalizarStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'rascunho' || value === 'encerrado' || value === 'revisao' || value === 'revisão') {
    return value === 'revisão' ? 'revisao' : value;
  }
  return 'publicado';
}

function formatarFormato(formato) {
  const valor = String(formato || '').toLowerCase();
  if (!valor) return '—';
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function formatarEntrada(entrada) {
  const value = String(entrada || '').toLowerCase().trim();
  if (value === 'gratuito') return 'Gratuito';
  if (value === 'pago') return 'Pago';
  return '—';
}

function resumirTexto(texto, limite) {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite).trimEnd()}...`;
}

function formatarDataCurta(dataIso) {
  if (!dataIso) return 'Data a definir';
  const data = new Date(`${dataIso}T00:00:00`);
  if (Number.isNaN(data.getTime())) return 'Data a definir';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatarDataLonga(dataIso) {
  if (!dataIso) return 'Data a definir';
  const data = new Date(`${dataIso}T00:00:00`);
  if (Number.isNaN(data.getTime())) return 'Data a definir';
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function listaFiltradaAtual() {
  return filtroAtual === 'todos'
    ? eventosInst
    : eventosInst.filter(e => e.status === filtroAtual);
}

function aplicarFiltroAtual() {
  renderEventos(listaFiltradaAtual());
}

/* =====================================================
   EDIÇÃO DE SEÇÕES
   ===================================================== */
function ativarEdicao(cId, canId, savId, edId) {
  document.getElementById(cId).classList.add('editing');
  document.getElementById(canId).style.display='flex';
  document.getElementById(savId).style.display='flex';
  document.getElementById(edId).style.display='none';
}
function cancelarEdicao(cId, canId, savId, edId) {
  document.getElementById(cId).classList.remove('editing');
  document.getElementById(canId).style.display='none';
  document.getElementById(savId).style.display='none';
  document.getElementById(edId).style.display='flex';
}
function salvarSecao(cId, canId, savId, edId, sec) {
  if(sec==='inst') {
    const fan = document.getElementById('fi-fantasia-input').value.trim();
    const tip = document.getElementById('fi-tipo-input').value;
    const are = document.getElementById('fi-area-input').value;
    const sit = document.getElementById('fi-site-input').value.trim();
    const dsc = document.getElementById('fi-desc-input').value.trim();
    setFV('fv-fantasia',fan||'—'); setFV('fv-tipo',tip); setFV('fv-area',are);
    setFV('fv-site',sit||'—');     setFV('fv-desc',dsc||'—');
    const fallbackName = document.getElementById('instName').textContent || 'Instituição';
    document.getElementById('instFantasia').textContent = fan || fallbackName;
    document.getElementById('navNome').textContent      = fan || fallbackName;
  }
  if(sec==='resp') {
    setFV('fv-resp-nome',  document.getElementById('fi-resp-nome-input').value  ||'—');
    setFV('fv-resp-cargo', document.getElementById('fi-resp-cargo-input').value ||'—');
    setFV('fv-resp-tel',   document.getElementById('fi-resp-tel-input').value   ||'—');
  }
  if(sec==='end') {
    setFV('fv-cep',    document.getElementById('fi-cep-input').value   ||'—');
    setFV('fv-logr',   document.getElementById('fi-logr-input').value  ||'—');
    setFV('fv-num',    document.getElementById('fi-num-input').value   ||'—');
    setFV('fv-cidade', document.getElementById('fi-cidade-input').value||'—');
    setFV('fv-estado', document.getElementById('fi-estado-input').value||'—');
  }
  if(sec==='email') {
    const em = document.getElementById('fi-email-input').value.trim();
    setFV('fv-email', em||'—');
  }
  cancelarEdicao(cId, canId, savId, edId);
  showToast('Dados salvos com sucesso!');
}

/* =====================================================
   LOGO
   ===================================================== */
function trocarLogo(input) {
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const avatarData = e.target.result;
    const img = document.getElementById('logoImg');
    img.src=avatarData; img.style.display='block';
    document.getElementById('logoInitials').style.display='none';

    try {
      const response = await apiFetch('/profile/avatar', {
        method: 'PUT',
        body: { avatar_data: avatarData },
      });
      const updatedUser = response?.user || {};
      Auth.updateUser({ avatar_data: updatedUser.avatar_data || avatarData });
      showToast('Foto da instituição atualizada!');
    } catch (error) {
      const msg = error?.payload?.message || error?.message || 'Não foi possível salvar a foto da instituição.';
      showToast(msg, true);
    }
  };
  reader.readAsDataURL(file);
}

/* =====================================================
   RENDER EVENTOS
   ===================================================== */
const statusLabels  = { publicado:'Publicado', rascunho:'Rascunho', encerrado:'Encerrado', revisao:'Em Revisão' };
const statusClasses = { publicado:'pill-publicado', rascunho:'pill-rascunho', encerrado:'pill-encerrado', revisao:'pill-revisao' };

function renderEventos(lista) {
  const container = document.getElementById('listaEventos');
  const empty     = document.getElementById('emptyState');
  if(!lista.length) { container.innerHTML=''; empty.classList.remove('d-none'); return; }
  empty.classList.add('d-none');

  container.innerHTML = lista.map(ev => {
    const dataFmt = formatarDataCurta(ev.data);
    return `
    <div class="ev-item" data-status="${ev.status}" data-id="${ev.id}">
      <div class="ev-item-main">
        <div class="ev-item-thumb">
          <img src="${ev.img}" alt="${ev.nome}" loading="lazy"/>
        </div>
        <div class="ev-item-body">
          <div class="ev-item-top">
            <div>
              <h5 class="ev-item-name">${ev.nome}</h5>
              <div class="ev-meta-row">
                <span class="ev-meta-item"><i class="bi bi-tags-fill"></i>${ev.categoria}</span>
                <span class="ev-meta-item"><i class="bi bi-calendar3"></i>${dataFmt}</span>
                <span class="ev-meta-item"><i class="bi bi-clock-fill"></i>${ev.horaIni}${ev.horaFim?' às '+ev.horaFim:''}</span>
                <span class="ev-meta-item"><i class="bi bi-geo-alt-fill"></i>${ev.localNome}, ${ev.cidade} – ${ev.estado}</span>
                <span class="ev-meta-item"><i class="bi bi-display"></i>${ev.formato}</span>
                <span class="ev-meta-item"><i class="bi bi-ticket-perforated-fill"></i>${ev.entrada}${ev.valor&&ev.valor!=='—'?' – '+ev.valor:''}</span>
              </div>
              <p class="ev-desc-preview">${ev.descCurta}</p>
            </div>
            <div class="d-flex flex-column align-items-end gap-2">
              <span class="ev-status-pill ${statusClasses[ev.status]}">${statusLabels[ev.status]}</span>
              <div class="inscritos-badge">
                <i class="bi bi-people-fill" style="color:var(--primary);"></i>
                <span class="num">${ev.inscritos}</span>
                <span style="font-size:.72rem;color:var(--muted);">inscritos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ev-actions">
        <button class="btn-ev-ver" onclick="verEvento(${ev.id})"><i class="bi bi-eye"></i>Ver detalhes</button>
        <button class="btn-ev-editar" onclick="abrirEditarDireto(${ev.id})"><i class="bi bi-pencil-fill"></i>Editar</button>
        <button class="btn-ev-excluir" onclick="pedirExclusao(${ev.id},'${ev.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3-fill"></i>Excluir</button>
      </div>
    </div>`; }).join('');
}

function filtrar(status, btn) {
  document.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filtroAtual = status;
  aplicarFiltroAtual();
}

/* =====================================================
   VER EVENTO
   ===================================================== */
let eventoAtual = null;

function verEvento(id) {
  const ev = eventosInst.find(e=>e.id===id); if(!ev) return;
  eventoAtual = ev;
  const dataFmt = formatarDataLonga(ev.data);
  const rowEntrada = document.getElementById('mv-row-entrada');
  const rowInscritos = document.getElementById('mv-row-inscritos');

  document.getElementById('mv-img').src       = ev.img;
  document.getElementById('mv-nome').textContent   = ev.nome;
  document.getElementById('mv-cat').textContent    = ev.categoria;
  document.getElementById('mv-data').textContent   = dataFmt;
  document.getElementById('mv-hora').textContent   = ev.horaIni + (ev.horaFim ? ' às ' + ev.horaFim : '');
  document.getElementById('mv-local').textContent  = ev.localNome+', '+ev.cidade+' – '+ev.estado;
  document.getElementById('mv-formato').textContent= ev.formato;
  document.getElementById('mv-entrada').textContent= ev.entrada+(ev.valor&&ev.valor!=='—'?' – '+ev.valor:'');
  document.getElementById('mv-idade').textContent  = ev.idade;
  document.getElementById('mv-inscritos').textContent = ev.capacidade > 0
    ? `${ev.inscritos} / ${ev.capacidade}`
    : `${ev.inscritos}`;
  document.getElementById('mv-desc').textContent   = ev.desc;

  if (rowEntrada) {
    rowEntrada.classList.toggle('d-none', !ev.temEntrada);
  }
  if (rowInscritos) {
    rowInscritos.classList.toggle('d-none', !ev.temInscricoes);
  }

  const pill = document.getElementById('mv-status');
  pill.textContent = statusLabels[ev.status];
  pill.className   = 'ev-status-pill position-absolute bottom-0 start-0 m-3 '+statusClasses[ev.status];

  new bootstrap.Modal(document.getElementById('modalVerEvento')).show();
}

/* =====================================================
   EDITAR EVENTO
   ===================================================== */
function abrirEditar() {
  bootstrap.Modal.getInstance(document.getElementById('modalVerEvento')).hide();
  setTimeout(()=>{ if(eventoAtual) preencherFormEditar(eventoAtual); new bootstrap.Modal(document.getElementById('modalEditarEvento')).show(); }, 350);
}

function abrirEditarDireto(id) {
  const ev = eventosInst.find(e=>e.id===id); if(!ev) return;
  eventoAtual = ev;
  preencherFormEditar(ev);
  new bootstrap.Modal(document.getElementById('modalEditarEvento')).show();
}

function preencherFormEditar(ev) {
  setVal('me-nome',      ev.nome);
  setVal('me-desc-curta',ev.descCurta);
  setVal('me-desc',      ev.desc);
  setVal('me-data',      ev.data);
  setVal('me-hora-ini',  ev.horaIni);
  setVal('me-hora-fim',  ev.horaFim||'');
  setVal('me-local-nome',ev.localNome);
  setVal('me-cidade',    ev.cidade);
  setSel('me-categoria', ev.categoria);
  setSel('me-idade',     ev.idade);
  setSel('me-formato',   ev.formato);
  setSel('me-entrada',   String(ev.entrada || '').toLowerCase());
  setSel('me-estado',    ev.estado);

  imagemEdicaoEvento = ev.imagemUrlOriginal || '';
  const input = document.getElementById('me-img-input');
  if (input) input.value = '';
  renderPreviewImagemEdicao(imagemEdicaoEvento);
}

function renderPreviewImagemEdicao(src) {
  const wrap = document.getElementById('me-img-preview-wrap');
  const img = document.getElementById('me-img-preview');
  const placeholder = document.getElementById('me-img-placeholder');
  if (!wrap || !img || !placeholder) return;

  const temImagem = Boolean(src);
  wrap.classList.toggle('d-none', !temImagem);
  placeholder.style.display = temImagem ? 'none' : 'block';
  img.src = temImagem ? src : '';
}

function carregarImagemEdicao(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!String(file.type || '').startsWith('image/')) {
    showToast('Selecione um arquivo de imagem válido.', true);
    input.value = '';
    return;
  }
  if (file.size > 1_800_000) {
    showToast('Imagem muito grande. Use até 1,8 MB.', true);
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imagemEdicaoEvento = String(e?.target?.result || '');
    renderPreviewImagemEdicao(imagemEdicaoEvento);
  };
  reader.readAsDataURL(file);
}

function removerImagemEdicao() {
  imagemEdicaoEvento = '';
  const input = document.getElementById('me-img-input');
  if (input) input.value = '';
  renderPreviewImagemEdicao('');
}

async function salvarEdicaoEvento() {
  if(!eventoAtual) return;
  const idx = eventosInst.findIndex(e=>e.id===eventoAtual.id);
  if(idx===-1) return;

  const payload = {
    nome: document.getElementById('me-nome').value.trim() || eventosInst[idx].nome,
    descricao: document.getElementById('me-desc').value.trim() || eventosInst[idx].desc,
    data_inicio: document.getElementById('me-data').value || eventosInst[idx].data,
    hora_inicio: document.getElementById('me-hora-ini').value || null,
    hora_fim: document.getElementById('me-hora-fim').value || null,
    local_nome: document.getElementById('me-local-nome').value.trim() || eventosInst[idx].localNome,
    cidade: document.getElementById('me-cidade').value.trim() || eventosInst[idx].cidade,
    estado: document.getElementById('me-estado').value || eventosInst[idx].estado,
    categoria: document.getElementById('me-categoria').value || eventosInst[idx].categoria,
    idade: document.getElementById('me-idade').value || eventosInst[idx].idade,
    formato: document.getElementById('me-formato').value || eventosInst[idx].formato,
    entrada: document.getElementById('me-entrada').value || String(eventosInst[idx].entrada || '').toLowerCase() || 'gratuito',
    imagem_url: imagemEdicaoEvento || null,
  };

  try {
    await apiFetch(`/events/${eventoAtual.id}`, {
      method: 'PUT',
      body: payload,
    });

    bootstrap.Modal.getInstance(document.getElementById('modalEditarEvento')).hide();
    await carregarEventosDaApi(usuarioInstituicaoId);
    showToast('Evento atualizado com sucesso!');
    eventoAtual = null;
  } catch (error) {
    const msg = error?.payload?.message || error?.message || 'Não foi possível atualizar o evento.';
    showToast(msg, true);
  }
}

/* =====================================================
   EXCLUIR EVENTO
   ===================================================== */
let excluirTarget = null;

function pedirExclusao(id, nome) {
  excluirTarget = id;
  document.getElementById('delEvNome').textContent = nome;
  new bootstrap.Modal(document.getElementById('modalExcluirEvento')).show();
}

async function confirmarExclusao() {
  if(!excluirTarget) return;

  try {
    await apiFetch(`/events/${excluirTarget}`, { method: 'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById('modalExcluirEvento')).hide();
    excluirTarget = null;
    await carregarEventosDaApi(usuarioInstituicaoId);
    showToast('Evento excluído.');
  } catch (error) {
    const msg = error?.payload?.message || error?.message || 'Não foi possível excluir o evento.';
    showToast(msg, true);
  }
}

function atualizarStats() {
  const tot = eventosInst.length;
  const pub = eventosInst.filter(e=>e.status==='publicado').length;
  const ras = eventosInst.filter(e=>e.status==='rascunho').length;
  const ins = eventosInst.reduce((a,e)=>a+e.inscritos,0);
  document.getElementById('st-total').textContent = tot;
  document.getElementById('st-pub').textContent   = pub;
  document.getElementById('st-ras').textContent   = ras;
  document.getElementById('st-ins').textContent   = ins;
  document.getElementById('totalEventos').textContent   = tot;
  document.getElementById('totalPublicados').textContent= pub;
  document.getElementById('totalInscritos').textContent = ins;
}

/* =====================================================
   SENHA & SEGURANÇA
   ===================================================== */
function togglePass(inputId, iconId) {
  const inp=document.getElementById(inputId), icon=document.getElementById(iconId);
  const vis=inp.type==='text';
  inp.type=vis?'password':'text';
  icon.className=vis?'bi bi-eye-fill':'bi bi-eye-slash-fill';
}
function avaliarSenha(inp) {
  const v=inp.value; let pts=0;
  if(v.length>=8) pts++; if(/[A-Z]/.test(v)) pts++; if(/[0-9]/.test(v)) pts++; if(/[^a-zA-Z0-9]/.test(v)) pts++;
  const cores=['#ef4444','#f97316','#eab308','#22c55e'], labels=['Fraca','Regular','Boa','Forte'];
  for(let i=1;i<=4;i++) document.getElementById(`sb${i}`).style.background=i<=pts?cores[pts-1]:'#e5e7eb';
  const lbl=document.getElementById('slabel');
  lbl.textContent=pts>0?labels[pts-1]:''; lbl.style.color=pts>0?cores[pts-1]:'var(--muted)';
}
function salvarSenha() {
  const a=document.getElementById('senhaAtual').value, n=document.getElementById('senhaNova').value, c=document.getElementById('senhaConf').value;
  if(!a||!n||!c) { showToast('Preencha todos os campos.',true); return; }
  if(n.length<8)  { showToast('A nova senha deve ter no mínimo 8 caracteres.',true); return; }
  if(n!==c)       { showToast('As senhas não coincidem.',true); return; }
  document.getElementById('senhaAtual').value='';
  document.getElementById('senhaNova').value='';
  document.getElementById('senhaConf').value='';
  showToast('Senha atualizada com sucesso!');
}
function excluirConta() {
  if(document.getElementById('inputConfExcluir').value.trim()!=='EXCLUIR') { showToast('Digite EXCLUIR para confirmar.',true); return; }
  Auth.logout();
}

/* =====================================================
   MÁSCARAS
   ===================================================== */
function maskTel(el) {
  let v=el.value.replace(/\D/g,'').slice(0,11);
  if(v.length<=10) v=v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  else             v=v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
  el.value=v;
}
function maskCEP(el) {
  let v=el.value.replace(/\D/g,'').slice(0,8);
  el.value=v.replace(/(\d{5})(\d{1,3})/,'$1-$2');
}

/* =====================================================
   TOAST
   ===================================================== */
let toastTimer;
function showToast(msg, erro=false) {
  const t=document.getElementById('toast'), i=t.querySelector('i');
  document.getElementById('toastMsg').textContent=msg;
  t.style.borderLeftColor=erro?'#ef4444':'#22c55e';
  i.className=erro?'bi bi-x-circle-fill':'bi bi-check-circle-fill';
  i.style.color=erro?'#ef4444':'#22c55e';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),3200);
}