# Plano de Ação - Correção de Conformidade

## 🚀 Passo a Passo para Alinhamento

### **FASE 1: CRÍTICO (1-2 semanas)**

#### 1.1 - Completar CRUD de Eventos
**Arquivo:** `backend/models.py` e `backend/app.py`

**O que adicionar:**

```python
# models.py - Adicionar função
def update_event(event_id, organizador_id, **kwargs):
    """Apenas o organizador pode atualizar seu evento"""
    conn = get_connection()
    try:
        # Validar ownership
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT organizador_id FROM events WHERE id = %s', (event_id,))
        event = cursor.fetchone()
        if not event or event['organizador_id'] != organizador_id:
            return False
        
        fields = []
        params = []
        for key, value in kwargs.items():
            if value is not None:
                fields.append(f'{key} = %s')
                params.append(value)
        
        if not fields:
            return True
        
        params.extend([event_id, organizador_id])
        sql = f"UPDATE events SET {', '.join(fields)} WHERE id = %s AND organizador_id = %s"
        cursor.execute(sql, tuple(params))
        conn.commit()
        return True
    finally:
        cursor.close()
        conn.close()

def delete_event(event_id, organizador_id):
    """Apenas o organizador pode deletar seu evento"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM events WHERE id = %s AND organizador_id = %s',
            (event_id, organizador_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()
```

**Rotas a adicionar em app.py:**

```python
@app.route('/api/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event_route(event_id):
    user_id = get_jwt_identity()
    data = request.json or {}
    
    if update_event(event_id, user_id, **data):
        event = get_event(event_id)
        return jsonify(event.to_dict()), 200
    return jsonify({'message': 'Evento não encontrado ou sem permissão'}), 403

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event_route(event_id):
    user_id = get_jwt_identity()
    if delete_event(event_id, user_id):
        return jsonify({'message': 'Evento deletado com sucesso'}), 200
    return jsonify({'message': 'Evento não encontrado ou sem permissão'}), 403

@app.route('/api/my-events', methods=['GET'])
@jwt_required()
def my_events_route():
    user_id = get_jwt_identity()
    events = list_events(organizador_id=user_id)
    return jsonify({'events': [event.to_dict() for event in events]}), 200
```

---

#### 1.2 - Implementar Modelo EventTicket
**Arquivo:** `backend/models.py`

**Adicionar classe e funções:**

```python
class EventTicket:
    def __init__(self, data):
        self.id = data['id']
        self.evento_id = data['evento_id']
        self.tipo = data.get('tipo')
        self.preco = data.get('preco')
        self.quantidade = data.get('quantidade')
        self.gratuito = data.get('gratuito')

    def to_dict(self):
        return {
            'id': self.id,
            'evento_id': self.evento_id,
            'tipo': self.tipo,
            'preco': float(self.preco) if self.preco else 0,
            'quantidade': self.quantidade,
            'gratuito': self.gratuito,
        }

def create_event_ticket(evento_id, tipo, preco=0, quantidade=0, gratuito=False):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO event_tickets (evento_id, tipo, preco, quantidade, gratuito)
            VALUES (%s, %s, %s, %s, %s)
            ''',
            (evento_id, tipo, preco, quantidade, gratuito),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def get_event_tickets(evento_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM event_tickets WHERE evento_id = %s', (evento_id,))
        rows = cursor.fetchall()
        return [EventTicket(row) for row in rows]
    finally:
        cursor.close()
        conn.close()

def update_event_ticket(ticket_id, evento_id, **kwargs):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        fields = []
        params = []
        for key, value in kwargs.items():
            if value is not None:
                fields.append(f'{key} = %s')
                params.append(value)
        
        if not fields:
            return True
        
        params.extend([ticket_id, evento_id])
        sql = f"UPDATE event_tickets SET {', '.join(fields)} WHERE id = %s AND evento_id = %s"
        cursor.execute(sql, tuple(params))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()

def delete_event_ticket(ticket_id, evento_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM event_tickets WHERE id = %s AND evento_id = %s', (ticket_id, evento_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()
```

**Rotas em app.py:**

```python
from models import (
    # ... existentes ...
    create_event_ticket,
    get_event_tickets,
    update_event_ticket,
    delete_event_ticket,
)

@app.route('/api/events/<int:event_id>/tickets', methods=['POST'])
@jwt_required()
def create_ticket_route(event_id):
    user_id = get_jwt_identity()
    
    # Validar se é organizador do evento
    event = get_event(event_id)
    if not event or event.organizador_id != user_id:
        return jsonify({'message': 'Sem permissão'}), 403
    
    data = request.json or {}
    ticket_id = create_event_ticket(
        evento_id=event_id,
        tipo=data.get('tipo'),
        preco=data.get('preco'),
        quantidade=data.get('quantidade'),
        gratuito=data.get('gratuito', False),
    )
    return jsonify({'message': 'Ingresso criado', 'ticket_id': ticket_id}), 201

@app.route('/api/events/<int:event_id>/tickets', methods=['GET'])
def get_tickets_route(event_id):
    tickets = get_event_tickets(event_id)
    return jsonify({'tickets': [ticket.to_dict() for ticket in tickets]}), 200

@app.route('/api/events/<int:event_id>/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket_route(event_id, ticket_id):
    user_id = get_jwt_identity()
    event = get_event(event_id)
    if not event or event.organizador_id != user_id:
        return jsonify({'message': 'Sem permissão'}), 403
    
    data = request.json or {}
    if update_event_ticket(ticket_id, event_id, **data):
        return jsonify({'message': 'Ingresso atualizado'}), 200
    return jsonify({'message': 'Ingresso não encontrado'}), 404

@app.route('/api/events/<int:event_id>/tickets/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_ticket_route(event_id, ticket_id):
    user_id = get_jwt_identity()
    event = get_event(event_id)
    if not event or event.organizador_id != user_id:
        return jsonify({'message': 'Sem permissão'}), 403
    
    if delete_event_ticket(ticket_id, event_id):
        return jsonify({'message': 'Ingresso deletado'}), 200
    return jsonify({'message': 'Ingresso não encontrado'}), 404
```

---

### **FASE 2: IMPORTANTE (2-4 semanas)**

#### 2.1 - Criar Tabela de Participantes

**SQL a executar:**

```sql
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    ticket_id INT,
    confirmado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES event_tickets(id) ON DELETE SET NULL,
    UNIQUE KEY unique_registration (evento_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.2 - Modelo de Registros

**Adicionar a models.py:**

```python
class EventRegistration:
    def __init__(self, data):
        self.id = data['id']
        self.evento_id = data['evento_id']
        self.usuario_id = data['usuario_id']
        self.ticket_id = data.get('ticket_id')
        self.confirmado = data.get('confirmado')
        self.criado_em = data.get('criado_em')

    def to_dict(self):
        return {
            'id': self.id,
            'evento_id': self.evento_id,
            'usuario_id': self.usuario_id,
            'ticket_id': self.ticket_id,
            'confirmado': self.confirmado,
            'criado_em': self.criado_em.isoformat() if hasattr(self.criado_em, 'isoformat') else self.criado_em,
        }

def register_for_event(evento_id, usuario_id, ticket_id=None):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO event_registrations (evento_id, usuario_id, ticket_id, confirmado)
            VALUES (%s, %s, %s, TRUE)
            ''',
            (evento_id, usuario_id, ticket_id),
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()

def get_event_registrations(evento_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM event_registrations WHERE evento_id = %s', (evento_id,))
        rows = cursor.fetchall()
        return [EventRegistration(row) for row in rows]
    finally:
        cursor.close()
        conn.close()

def get_user_registrations(usuario_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM event_registrations WHERE usuario_id = %s', (usuario_id,))
        rows = cursor.fetchall()
        return [EventRegistration(row) for row in rows]
    finally:
        cursor.close()
        conn.close()

def unregister_from_event(evento_id, usuario_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM event_registrations WHERE evento_id = %s AND usuario_id = %s',
            (evento_id, usuario_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()
```

**Rotas em app.py:**

```python
@app.route('/api/events/<int:event_id>/join', methods=['POST'])
@jwt_required()
def join_event_route(event_id):
    user_id = get_jwt_identity()
    data = request.json or {}
    
    registration_id = register_for_event(
        evento_id=event_id,
        usuario_id=user_id,
        ticket_id=data.get('ticket_id')
    )
    
    if registration_id:
        return jsonify({'message': 'Inscrito com sucesso', 'registration_id': registration_id}), 201
    return jsonify({'message': 'Erro ao inscrever (pode estar duplicado)'}), 400

@app.route('/api/events/<int:event_id>/leave', methods=['POST'])
@jwt_required()
def leave_event_route(event_id):
    user_id = get_jwt_identity()
    if unregister_from_event(event_id, user_id):
        return jsonify({'message': 'Inscrição cancelada'}), 200
    return jsonify({'message': 'Não está inscrito neste evento'}), 404

@app.route('/api/events/<int:event_id>/participants', methods=['GET'])
def get_participants_route(event_id):
    registrations = get_event_registrations(event_id)
    return jsonify({'participants': [r.to_dict() for r in registrations]}), 200

@app.route('/api/my-registrations', methods=['GET'])
@jwt_required()
def my_registrations_route():
    user_id = get_jwt_identity()
    registrations = get_user_registrations(user_id)
    return jsonify({'registrations': [r.to_dict() for r in registrations]}), 200
```

---

#### 2.3 - Validações de Regra de Negócio

**Adicionar a models.py:**

```python
def can_register_for_event(evento_id, usuario_id):
    """Validar se pode se inscrever (não duplicado, evento existe, etc)"""
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verificar se evento existe
        cursor.execute('SELECT id FROM events WHERE id = %s', (evento_id,))
        if not cursor.fetchone():
            return False, 'Evento não existe'
        
        # Verificar se já está inscrito
        cursor.execute(
            'SELECT id FROM event_registrations WHERE evento_id = %s AND usuario_id = %s',
            (evento_id, usuario_id),
        )
        if cursor.fetchone():
            return False, 'Você já está inscrito neste evento'
        
        return True, 'OK'
    finally:
        cursor.close()
        conn.close()

def validate_event_age_requirement(evento_id, usuario_id):
    """Validar se usuário atende requisito de idade"""
    # TODO: Implementar quando houver data de nascimento no schema
    return True, 'OK'
```

---

### **FASE 3: DESEJÁVEL (4-8 semanas)**

#### 3.1 - Sistema de Pagamento
- Integrar Stripe/PayPal
- Criar tabela `payments`
- Validar pagamento antes de confirmar inscrição

#### 3.2 - Melhorias Frontend
- Adicionar formulário para criar/editar eventos
- Visualização de "Meus Eventos"
- Fluxo de inscrição em eventos
- Carrinho de compra para ingressos pagos

#### 3.3 - Notificações
- Email ao criar evento
- Email ao inscrever
- Email ao deletar evento

---

## 📋 Checklist de Implementação

### FASE 1
- [ ] Função `update_event()` em models.py
- [ ] Função `delete_event()` em models.py
- [ ] Rota `PUT /api/events/<id>` 
- [ ] Rota `DELETE /api/events/<id>`
- [ ] Rota `GET /api/my-events`
- [ ] Classe `EventTicket` em models.py
- [ ] Funções CRUD de tickets
- [ ] Rotas de tickets (POST, GET, PUT, DELETE)
- [ ] Testes de autorização (apenas organizador)

### FASE 2
- [ ] Tabela `event_registrations` criada
- [ ] Classe `EventRegistration` em models.py
- [ ] Funções de registro/inscrição
- [ ] Rota `POST /api/events/<id>/join`
- [ ] Rota `POST /api/events/<id>/leave`
- [ ] Rota `GET /api/events/<id>/participants`
- [ ] Rota `GET /api/my-registrations`
- [ ] Validações de duplicação
- [ ] Testes E2E de fluxo de inscrição

### FASE 3
- [ ] Integração de pagamento
- [ ] Tabela de transações
- [ ] Frontend para compra de ingressos
- [ ] Sistema de notificações
- [ ] Documentação API atualizada

