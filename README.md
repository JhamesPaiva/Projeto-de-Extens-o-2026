# Projeto-de-Extens-o-2026

Plataforma web para divulgacao de eventos comunitarios, conectando organizadores e participantes de forma simples e acessivel.

## Portal de Eventos Comunitarios

O projeto oferece listagem, busca, visualizacao detalhada e cadastro de eventos, com autenticacao de usuarios e area para organizadores e participantes.

## Stack Atual

### Frontend

- HTML5
- CSS3
- Bootstrap
- JavaScript

### Backend

- Python
- Flask
- Flask-JWT-Extended
- Flask-CORS

### Banco de Dados

- MySQL

## Estrutura Atual

```text
Projeto-de-Extens-o-2026/
	backend/    Backend Flask e integracao com MySQL
	frontend/   Interface web em HTML, CSS e JavaScript
	database/   Scripts SQL
	docs/       Documentacao funcional e tecnica
```

## Como Executar

O caminho recomendado esta documentado em [SETUP_GUIDE.md](d:/Documentos/EXTENSÃO%202026/Projeto-de-Extens-o-2026/SETUP_GUIDE.md).

Resumo rapido:

1. Configure o banco MySQL.
2. Instale as dependencias Python do backend.
3. Execute o backend Flask em `http://localhost:5000`.
4. Sirva o frontend estatico em `http://localhost:3000`.

## Funcionalidades Atuais

- Cadastro e login de usuarios
- Edicao de perfil
- Cadastro de eventos
- Listagem e filtros de eventos
- Detalhamento de eventos
- Inscricao e cancelamento de inscricoes

## Observacao de Arquitetura

O backend oficial em uso neste repositório e o backend Flask em `backend/`.
Estruturas antigas ou placeholders de outras stacks nao devem ser consideradas fonte principal do projeto.

## Licenca

Este projeto esta sob a licenca MIT.

