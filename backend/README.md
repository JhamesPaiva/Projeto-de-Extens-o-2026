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

## Endpoints principais

- `GET /api/ping`
- `POST /api/register`
- `POST /api/login`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/events`
- `GET /api/events/<id>`
- `POST /api/events`
