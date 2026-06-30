# Backend Python do EventoCom

Este backend utiliza Flask, JWT e MySQL para fornecer autenticação de usuários e gerenciamento de eventos.

## Instalação

1. Crie um ambiente virtual (recomendado):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

2. Instale as dependências:

```powershell
pip install -r requirements.txt
```

3. Crie o banco de dados MySQL e execute `database/squema.sql`.
4. Ajuste `backend/.env` com as credenciais do banco de dados.

## Execução

```powershell
python app.py
```

O backend ficará disponível em `http://localhost:5000`.

## Organizacao Atual

Depois da primeira etapa de refatoracao, o backend passou a separar inicializacao, rotas e services:

```text
backend/
	app.py              Runner da aplicacao
	app_factory.py      Factory Flask e registro de blueprints
	api/                Rotas HTTP por dominio
	services/           Regras de aplicacao e validacoes de entrada
	repositories/       Fronteira inicial de persistencia usada pelos services
	models.py           Entidades de dominio usadas pela aplicacao
	database.py         Conexao com MySQL
	config.py           Configuracoes
```

Observacao: a persistencia principal agora esta em `repositories/`. O arquivo `models.py` foi reduzido para entidades compartilhadas pela camada de aplicacao.

## Endpoints principais

### Saúde

- `GET /api/ping`

### Autenticação

- `POST /api/register`
- `POST /api/login`

### Perfil (requer token JWT)

- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/avatar`

### Eventos

- `GET /api/events` — lista eventos; aceita filtros via query string (`categoria`, `cidade`, `estado`, `formato`, `entrada`, `idade`, `data`, `search`, `organizador_id`)
- `GET /api/events/<id>` — detalhe de um evento
- `POST /api/events` — cria evento (requer token JWT)
- `PUT /api/events/<id>` — edita evento (requer token JWT; apenas o organizador do evento)
- `DELETE /api/events/<id>` — exclui evento (requer token JWT; apenas o organizador do evento)

### Inscrições (requer token JWT)

- `POST /api/events/<id>/subscribe` — inscreve o usuário no evento
- `POST /api/events/<id>/subscribe/confirm-payment` — confirma pagamento de uma inscrição pendente
- `DELETE /api/events/<id>/subscribe` — cancela a inscrição
- `GET /api/my-subscriptions` — lista os eventos em que o usuário está inscrito