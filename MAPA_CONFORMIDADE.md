# Mapa de Conformidade - Banco de Dados vs Backend

## 📍 Mapeamento de Tabelas → Modelos → Rotas

### Tabela: `users`
```
✅ CONFORME
│
├─ Modelo: User (models.py)           [✅ Implementado]
├─ Criar usuário                      [✅ POST /api/register]
├─ Obter usuário                      [✅ GET /api/profile (via JWT)]
│  └─ Por ID: get_user_by_id()        [✅ Implementado]
│  └─ Por email: find_user_by_email() [✅ Implementado]
├─ Atualizar usuário                  [✅ PUT /api/profile]
└─ Deletar usuário                    [❌ NÃO EXISTE]
```

### Tabela: `events`
```
⚠️ PARCIALMENTE CONFORME
│
├─ Modelo: Event (models.py)          [✅ Implementado]
├─ Criar evento                       [✅ POST /api/events]
├─ Listar eventos                     [✅ GET /api/events]
│  └─ Com filtros                     [✅ categoria, cidade, estado, formato]
│  └─ Com busca                       [✅ search por nome/descricao]
├─ Obter detalhes                     [✅ GET /api/events/<id>]
├─ Atualizar evento                   [❌ PUT /api/events/<id> - FALTANDO]
├─ Deletar evento                     [❌ DELETE /api/events/<id> - FALTANDO]
└─ Listar eventos de um organizador   [⚠️ Parcial - via filtro organizador_id]
```

### Tabela: `event_tickets`
```
❌ NÃO CONFORME - COMPLETAMENTE AUSENTE
│
├─ Modelo: EventTicket               [❌ NÃO EXISTE]
├─ Criar ticket                      [❌ POST /api/events/<id>/tickets - NÃO EXISTE]
├─ Listar tickets                    [❌ GET /api/events/<id>/tickets - NÃO EXISTE]
├─ Atualizar ticket                  [❌ PUT /api/events/<id>/tickets/<id> - NÃO EXISTE]
└─ Deletar ticket                    [❌ DELETE /api/events/<id>/tickets/<id> - NÃO EXISTE]
```

---

## ⚖️ Tabela Comparativa Detalhada

| Recurso | Schema | Backend | Frontend | Obs |
|---------|--------|---------|----------|-----|
| **USERS** | | | | |
| Criar conta | ✅ users | ✅ POST /api/register | ✅ cadastro.js | Completo |
| Login | ✅ senha_hash | ✅ POST /api/login | ✅ login.js | JWT OK |
| Ver perfil | ✅ users.* | ✅ GET /api/profile | ✅ areausuario.js | Completo |
| Editar perfil | ✅ users.* | ✅ PUT /api/profile | ✅ areausuario.js | Completo |
| Deletar conta | ✅ schema suporta | ❌ Sem rota | ❌ | **FALTA** |
| **EVENTS** | | | | |
| Criar evento | ✅ events | ✅ POST /api/events | ✅ criarevento.js | Completo |
| Listar eventos | ✅ events | ✅ GET /api/events | ✅ home.js | Filtros OK |
| Ver detalhes | ✅ events | ✅ GET /api/events/<id> | ✅ detalhe.js | Completo |
| Editar evento | ✅ events | ❌ Sem rota PUT | ❌ | **FALTA** |
| Deletar evento | ✅ events | ❌ Sem rota DELETE | ❌ | **FALTA** |
| Meus eventos | ✅ events (via organizador_id) | ⚠️ Via filtro | ❌ | **Incompleto** |
| **TICKETS** | | | | |
| Criar ticket | ✅ event_tickets | ❌ Nenhuma função | ❌ | **FALTA** |
| Listar tickets | ✅ event_tickets | ❌ Nenhuma função | ❌ | **FALTA** |
| Editar ticket | ✅ event_tickets | ❌ Nenhuma função | ❌ | **FALTA** |
| Deletar ticket | ✅ event_tickets | ❌ Nenhuma função | ❌ | **FALTA** |
| **PARTICIPANTES** | ❌ INEXISTE | ❌ Sem modelo | ❌ Sem rota | **FALTA TUDO** |
| Inscrever em evento | ❌ | ❌ | ❌ | **FALTA** |
| Sair de evento | ❌ | ❌ | ❌ | **FALTA** |
| Ver inscritos | ❌ | ❌ | ❌ | **FALTA** |

---

## 📌 Campos Não Utilizados (Potencial Desperdício)

### Campos em `users` com baixa utilização:
- `cpf` - Armazenado, validações insuficientes
- `cnpj` - Armazenado, validações insuficientes
- `cep` - Armazenado, sem integração com API de localização

### Campos em `events` com funcionalidade incompleta:
- `idade` - Definido mas sem validação de limite etário
- `imagem_url` - Recebe URL mas sem validação ou upload backend
- `formato` - Campo ENUM (presencial, online, híbrido) mas sem lógica específica por tipo

---

## 🎯 Cobertura por Funcionalidade

```
Autenticação & Usuários:    ████████░░ 80% (falta delete)
Eventos (CRUD):            ██████░░░░ 60% (falta UPDATE/DELETE)
Ingressos:                 ░░░░░░░░░░  0% (completamente ausente)
Participação:              ░░░░░░░░░░  0% (completamente ausente)
Validações:                ██░░░░░░░░ 20% (básicas apenas)
Autorização:               ██░░░░░░░░ 20% (JWT ok, permissões não)
```

---

## 📄 Arquivos Afetados

**Backend (Python):**
- [backend/models.py](backend/models.py) - Faltam classes EventTicket e participação
- [backend/app.py](backend/app.py) - Faltam rotas de UPDATE/DELETE e tickets
- [backend/database.py](backend/database.py) - OK

**Banco de Dados:**
- [database/squema.sql](database/squema.sql) - Define event_tickets mas não é usada
- Falta: Tabela de participantes/inscritos

**Frontend:**
- Não há validação de limites de inscrição
- Não há fluxo de compra ingressos
- Não há visualização de meus ingressos

