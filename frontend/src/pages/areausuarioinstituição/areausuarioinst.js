/* =====================================================
   DADOS SIMULADOS
   ===================================================== */
const dadosInst = {
  razaoSocial: 'Instituto Cultural BH LTDA',
  fantasia:    'Instituto Cultural BH',
  cnpj:        '12.345.678/0001-99',
  tipo:        'ONG / Associação',
  area:        'Cultura & Arte',
  site:        'https://institutocultural.com.br',
  desc:        'Organização dedicada à promoção da cultura, arte e eventos comunitários em Belo Horizonte e região. Realizamos eventos educativos, shows, feiras e muito mais.',
  respNome:    'Carlos Mendes',
  respCpf:     '987.654.321-00',
  respCargo:   'Diretor Executivo',
  respTel:     '(31) 98765-4321',
  cep:         '30112-000',
  logradouro:  'Av. Afonso Pena',
  numero:      '1500',
  cidade:      'Belo Horizonte',
  estado:      'MG',
  email:       'instituicao@teste.com',
};

let eventosInst = [
  {
    id: 1, nome: 'Festival Verão Sonoro 2025', categoria: 'Música', status: 'publicado',
    data: '2025-07-12', horaIni: '16:00', horaFim: '23:00',
    formato: 'Presencial', localNome: 'Parque Municipal', cidade: 'São Paulo', estado: 'SP',
    entrada: 'Pago', valor: 'R$ 40,00', capacidade: 500, inscritos: 128, idade: 'Livre',
    descCurta: 'O maior festival de verão da cidade, com 20+ atrações musicais.',
    desc: 'O Festival Verão Sonoro reúne mais de 20 atrações musicais em um único dia, com palcos simultâneos, área gastronômica e espaço cultural. Uma experiência inesquecível no coração da cidade.',
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  },
  {
    id: 2, nome: 'Exposição Coletiva: Cores da Comunidade', categoria: 'Arte & Cultura', status: 'publicado',
    data: '2025-08-05', horaIni: '10:00', horaFim: '18:00',
    formato: 'Presencial', localNome: 'Centro Cultural', cidade: 'Curitiba', estado: 'PR',
    entrada: 'Gratuito', valor: '—', capacidade: 300, inscritos: 56, idade: 'Livre',
    descCurta: 'Exposição de artes visuais com 30 artistas locais sobre comunidade e diversidade.',
    desc: 'Uma exposição de artes visuais que reúne 30 artistas locais em torno do tema comunidade, pertencimento e diversidade. Pinturas, fotografias, esculturas e instalações ocupam todo o espaço do Centro Cultural.',
    img: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
  },
  {
    id: 3, nome: 'Workshop de Fotografia Urbana', categoria: 'Arte & Cultura', status: 'rascunho',
    data: '2025-09-20', horaIni: '09:00', horaFim: '13:00',
    formato: 'Presencial', localNome: 'Centro Cultural', cidade: 'Belo Horizonte', estado: 'MG',
    entrada: 'Pago', valor: 'R$ 80,00', capacidade: 30, inscritos: 0, idade: '+16',
    descCurta: 'Aprenda técnicas de fotografia nas ruas de BH com fotógrafos profissionais.',
    desc: 'Um workshop prático de fotografia urbana pelas ruas e vielas de Belo Horizonte. Técnicas de composição, luz natural e storytelling visual com instrutores renomados.',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },
];

/* =====================================================
   INIT
   ===================================================== */
;(function init() {
  Auth.restore();
  const user = Auth.getUser();
  if (!user || user.tipo !== 'pj') { window.location.href = 'login.html'; return; }

  document.getElementById('navNome').textContent = dadosInst.fantasia || dadosInst.razaoSocial;

  // Hero
  document.getElementById('instName').textContent    = dadosInst.razaoSocial;
  document.getElementById('instFantasia').textContent = dadosInst.fantasia;
  document.getElementById('logoInitials').textContent =
    dadosInst.fantasia.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  // Preenche campos de exibição
  document.getElementById('fv-razao-val').textContent = dadosInst.razaoSocial;
  document.getElementById('fv-cnpj-val').textContent  = dadosInst.cnpj;
  document.getElementById('fv-resp-cpf-val').textContent = dadosInst.respCpf;

  setFV('fv-fantasia',   dadosInst.fantasia);
  setFV('fv-tipo',       dadosInst.tipo);
  setFV('fv-area',       dadosInst.area);
  setFV('fv-site',       dadosInst.site);
  setFV('fv-desc',       dadosInst.desc);
  setFV('fv-resp-nome',  dadosInst.respNome);
  setFV('fv-resp-cargo', dadosInst.respCargo);
  setFV('fv-resp-tel',   dadosInst.respTel);
  setFV('fv-cep',        dadosInst.cep);
  setFV('fv-logr',       dadosInst.logradouro);
  setFV('fv-num',        dadosInst.numero);
  setFV('fv-cidade',     dadosInst.cidade);
  setFV('fv-estado',     dadosInst.estado);
  setFV('fv-email',      dadosInst.email);

  // Inputs de edição
  setVal('fi-fantasia-input',  dadosInst.fantasia);
  setVal('fi-desc-input',      dadosInst.desc);
  setVal('fi-resp-nome-input', dadosInst.respNome);
  setVal('fi-resp-cargo-input',dadosInst.respCargo);
  setVal('fi-resp-tel-input',  dadosInst.respTel);
  setVal('fi-cep-input',       dadosInst.cep);
  setVal('fi-logr-input',      dadosInst.logradouro);
  setVal('fi-num-input',       dadosInst.numero);
  setVal('fi-cidade-input',    dadosInst.cidade);
  setVal('fi-email-input',     dadosInst.email);
  setSel('fi-tipo-input',      dadosInst.tipo);
  setSel('fi-area-input',      dadosInst.area);
  setSel('fi-estado-input',    dadosInst.estado);

  renderEventos(eventosInst);
})();

function setFV(id, v) { const el=document.getElementById(id); if(el) el.textContent=v||'—'; }
function setVal(id,v) { const el=document.getElementById(id); if(el) el.value=v||''; }
function setSel(id,v) {
  const s=document.getElementById(id); if(!s) return;
  for(const o of s.options){ if(o.value===v||o.text===v){s.value=o.value;break;} }
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
    document.getElementById('instFantasia').textContent = fan || dadosInst.razaoSocial;
    document.getElementById('navNome').textContent      = fan || dadosInst.razaoSocial;
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
  reader.onload = e => {
    const img = document.getElementById('logoImg');
    img.src=e.target.result; img.style.display='block';
    document.getElementById('logoInitials').style.display='none';
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
    const d = new Date(ev.data+'T00:00:00');
    const dataFmt = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
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
  const lista = status==='todos' ? eventosInst : eventosInst.filter(e=>e.status===status);
  renderEventos(lista);
}

/* =====================================================
   VER EVENTO
   ===================================================== */
let eventoAtual = null;

function verEvento(id) {
  const ev = eventosInst.find(e=>e.id===id); if(!ev) return;
  eventoAtual = ev;
  const d = new Date(ev.data+'T00:00:00');
  const dataFmt = d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

  document.getElementById('mv-img').src       = ev.img;
  document.getElementById('mv-nome').textContent   = ev.nome;
  document.getElementById('mv-cat').textContent    = ev.categoria;
  document.getElementById('mv-data').textContent   = dataFmt;
  document.getElementById('mv-hora').textContent   = ev.horaIni + (ev.horaFim ? ' às ' + ev.horaFim : '');
  document.getElementById('mv-local').textContent  = ev.localNome+', '+ev.cidade+' – '+ev.estado;
  document.getElementById('mv-formato').textContent= ev.formato;
  document.getElementById('mv-entrada').textContent= ev.entrada+(ev.valor&&ev.valor!=='—'?' – '+ev.valor:'');
  document.getElementById('mv-idade').textContent  = ev.idade;
  document.getElementById('mv-inscritos').textContent = ev.inscritos + ' / ' + ev.capacidade;
  document.getElementById('mv-desc').textContent   = ev.desc;

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
  setVal('me-valor',     ev.valor==='—'?'':ev.valor);
  setVal('me-capacidade',ev.capacidade);
  setSel('me-categoria', ev.categoria);
  setSel('me-idade',     ev.idade);
  setSel('me-formato',   ev.formato);
  setSel('me-entrada',   ev.entrada);
  setSel('me-estado',    ev.estado);
  setSel('me-status',    ev.status);
}

function salvarEdicaoEvento() {
  if(!eventoAtual) return;
  const idx = eventosInst.findIndex(e=>e.id===eventoAtual.id);
  if(idx===-1) return;

  eventosInst[idx] = {
    ...eventosInst[idx],
    nome:      document.getElementById('me-nome').value.trim()       || eventosInst[idx].nome,
    descCurta: document.getElementById('me-desc-curta').value.trim(),
    desc:      document.getElementById('me-desc').value.trim(),
    data:      document.getElementById('me-data').value              || eventosInst[idx].data,
    horaIni:   document.getElementById('me-hora-ini').value          || eventosInst[idx].horaIni,
    horaFim:   document.getElementById('me-hora-fim').value,
    localNome: document.getElementById('me-local-nome').value.trim() || eventosInst[idx].localNome,
    cidade:    document.getElementById('me-cidade').value.trim()     || eventosInst[idx].cidade,
    estado:    document.getElementById('me-estado').value,
    entrada:   document.getElementById('me-entrada').value,
    valor:     document.getElementById('me-valor').value.trim()      || '—',
    capacidade:parseInt(document.getElementById('me-capacidade').value)||eventosInst[idx].capacidade,
    categoria: document.getElementById('me-categoria').value,
    idade:     document.getElementById('me-idade').value,
    formato:   document.getElementById('me-formato').value,
    status:    document.getElementById('me-status').value,
  };

  bootstrap.Modal.getInstance(document.getElementById('modalEditarEvento')).hide();
  renderEventos(eventosInst);
  atualizarStats();
  showToast('Evento atualizado com sucesso!');
  eventoAtual = null;
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

function confirmarExclusao() {
  if(!excluirTarget) return;
  eventosInst = eventosInst.filter(e=>e.id!==excluirTarget);
  bootstrap.Modal.getInstance(document.getElementById('modalExcluirEvento')).hide();
  renderEventos(eventosInst);
  atualizarStats();
  showToast('Evento excluído.');
  excluirTarget = null;
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