# Relatório de Conformidade: Projeto vs Banco de Dados

**Data:** 10 de Abril de 2026  
**Status:** ⚠️ Parcialmente Conforme

---

## 📊 Resumo Executivo

Seu projeto possui **conformidade parcial** com o banco de dados. Existem implementações corretas, mas faltam recursos importantes que estão definidos no schema.

---

## ✅ CONFORME - Características Implementadas

### **Banco de Dados - Tabelas**
- ✅ Tabela `users` (completa)
- ✅ Tabela `events` (completa)
- ⚠️ Tabela `event_tickets` (definida, mas não utilizada)

### **Backend Python (app.py)**
- ✅ `/api/ping` - Health check
- ✅ `/api/register` - Criação de usuário (POST)
- ✅ `/api/login` - Autenticação com JWT (POST)
- ✅ `/api/profile` - Obter perfil de usuário (GET)
- ✅ `/api/profile` - Atualizar perfil de usuário (PUT)
- ✅ `/api/events` - Listar eventos com filtros (GET)
- ✅ `/api/events/<id>` - Obter detalhes de evento (GET)
- ✅ `/api/events` - Criar evento (POST)

### **Models Python (models.py)**
- ✅ Classe `User` - Mapeia corretamente tabela `users`
- ✅ Classe `Event` - Mapeia corretamente tabela `events`
- ✅ Funções CRUD para usuários
- ✅ Funções CRUD para eventos (create, read, list)

### **Autenticação**
- ✅ JWT implementado corretamente
- ✅ Hash de senha com werkzeug

### **Frontend (api.js)**
- ✅ Base URL configurada corretamente
- ✅ Suporte a Bearer Token
- ✅ Headers e fetch corretamente implementados

---

## ❌ NÃO CONFORME - Lacunas Detectadas

### **1. Tabela `event_tickets` NÃO IMPLEMENTADA**
**Problema:** A tabela existe no banco de dados, mas há ZERO funcionalidades no backend.

**Campos da tabela:**
- `id` (INT, PK)
- `evento_id` (INT, FK)
- `tipo` (VARCHAR)
- `preco` (DECIMAL)
- `quantidade` (INT)
- `gratuito` (BOOLEAN)

**Faltam:**
- ❌ Modelo/Classe `EventTicket` em `models.py`
- ❌ Funções CRUD para gerenciar tickets
- ❌ Rotas para:
  - `POST /api/events/<id>/tickets` (criar ticket)
  - `GET /api/events/<id>/tickets` (listar tickets do evento)
  - `PUT /api/events/<id>/tickets/<ticket_id>` (atualizar ticket)
  - `DELETE /api/events/<id>/tickets/<ticket_id>` (deletar ticket)

---

### **2. Gerenciamento de Eventos INCOMPLETO**
**Problemas:**

| Operação | Status | Rota Necessária |
|----------|--------|-----------------|
| Criar evento | ✅ | `POST /api/events` |
| Listar eventos | ✅ | `GET /api/events` |
| Obter detalhes | ✅ | `GET /api/events/<id>` |
| **Atualizar evento** | ❌ | `PUT /api/events/<id>` |
| **Deletar evento** | ❌ | `DELETE /api/events/<id>` |
| **Listar meus eventos** | ❌ | `GET /api/my-events` |

---

### **3. Participantes/Inscritos de Eventos NÃO EXISTE**
**Problema:** Não há tabela de relação between usuários e eventos (participação).

**Faltam:**
- ❌ Tabela `event_participants` ou `event_registrations`
- ❌ Sistema para inscrever usuários em eventos
- ❌ Rota `POST /api/events/<id>/join` (participar)
- ❌ Rota `POST /api/events/<id>/leave` (sair)
- ❌ Rota `GET /api/events/<id>/participants` (listar participantes)
- ❌ Rota `GET /api/my-events` (minhas inscrições)

---

### **4. Estrutura Node.js SUBUTILIZADA**
**Problema:** Pasta `backend/src/` existe mas não está sendo usada.

```
backend/
├── src/
│   ├── app.js (não é iniciado)
│   ├── controllers/ (vazio)
│   ├── models/ (vazio)
│   ├── routes/ (vazio)
│   └── services/ (vazio)
└── app.py (backend real em Flask)
```

**Decision:** Mantenha apenas **Python Flask** ou refatore com **Node.js/Express**, não mantenha ambos.

---

### **5. Integração de Pagamentos NÃO EXISTE**
**Problema:** Tickets pagos não têm sistema de processamento.

**Faltam:**
- ❌ Integração com gateway de pagamento (Stripe, PayPal, etc)
- ❌ Tabela de transações
- ❌ Rota `/api/payment/checkout`
- ❌ Validação de pagamento antes de confirmar participação

---

### **6. Validações e Regras de Negócio**
**Problemas detectados:**

| Validação | Status |
|-----------|--------|
| Verificar se organizador existe ao criar evento | ⚠️ Parcial (sem validação clara) |
| Verificar limite de ingressos | ❌ Não existe |
| Verificar idade mínima do evento | ❌ Não existe |
| Impedir duplicação de inscrição | ❌ Não existe |
| Deletar evento apenas pelo organizador | ❌ Não existe |
| Atualizar evento apenas pelo organizador | ❌ Faltando rota |

---

## 📝 Recomendações de Prioridade

### **🔴 CRÍTICO (Implementar Urgentemente)**
1. Implementar CRUD completo de eventos (faltam UPDATE/DELETE)
2. Implementar modelo e rotas de `event_tickets`
3. Criar tabela de participantes/inscritos
4. Adicionar autorizações (apenas organizador pode editar/deletar evento)

### **🟠 IMPORTANTE (Próximas Sprints)**
1. Implementar sistema de inscrição em eventos
2. Validações de regras de negócio (idade, limite de ingressos)
3. Rotas para "Meus Eventos" e "Meus Ingressos"
4. Sistema de pagamento para ingressos

### **🟡 DESEJÁVEL (Melhorias Futuras)**
1. Deletar estrutura Node.js não utilizada ou refatorar para usar
2. Implementar notificações (novo evento, confirmação de inscrição)
3. Adicionar relatórios de eventos (número de inscritos, receita)
4. Sistema de avaliações/comentários em eventos

---

## 🔧 Próximos Passos

1. **Escolher arquitetura:** Manter só Python ou migrar tudo para Node.js?
2. **Expandir models.py:** Adicionar classes para tickets e participantes
3. **Implementar rotas faltantes:** UPDATE/DELETE eventos, gerenciar tickets
4. **Adicionar autorizações:** Validar permissões antes de certas operações
5. **Integrar sistema de inscrição:** Criar fluxo completo de participação

