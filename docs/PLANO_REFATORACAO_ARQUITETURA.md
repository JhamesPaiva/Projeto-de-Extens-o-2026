# Plano de Refatoracao de Arquitetura

## Objetivo

Organizar o projeto para reduzir acoplamento entre camadas, eliminar estruturas duplicadas e facilitar manutencao, testes e evolucao do produto.

## Problemas Estruturais Atuais

1. O repositório comunica mais de uma arquitetura ao mesmo tempo.
   - O README raiz ainda cita Node.js/Express como backend.
   - O backend real em uso esta em Python/Flask.
   - Existe uma estrutura Node paralela em `backend/src/` sem uso claro.

2. O backend concentra responsabilidades demais em poucos arquivos.
   - `backend/app.py` mistura rotas, validacao, autorizacao e regra de negocio.
   - `backend/models.py` mistura entidades, acesso a dados, regras de negocio e ajustes de schema.

3. O frontend depende de estado global e manipulacao direta via HTML.
   - `window.Auth`, `window.apiFetch`, `window.selectedEventId` e similares criam acoplamento implicito.
   - Ha uso extenso de `onclick`, `oninput` e handlers inline nas paginas.

4. Existem artefatos e nomes que aumentam confusao de manutencao.
   - `frontend/package.js` vazio.
   - `backend/package.json` vazio.
   - pasta `criarevento.html/` com nome inadequado para diretorio.
   - pasta `areausuarioinstituição/` com acento.
   - pasta descritiva `telas (Home, Eventos, Detalhe)` em `frontend/src/pages/`.

## Diretrizes de Organizacao

1. Uma stack oficial por responsabilidade.
   - Backend oficial: Flask.
   - Frontend oficial: HTML/CSS/JS modularizado.
   - Estruturas de stack nao usadas devem ser removidas ou arquivadas.

2. Separacao por camadas no backend.
   - API: recebe request/response.
   - Services: aplica regra de negocio.
   - Repositories: executa queries.
   - Domain: define entidades e contratos.
   - Infra: banco, config, inicializacao e migracoes.

3. Separacao por modulos no frontend.
   - Core compartilhado: auth, api, storage, config.
   - Modules: eventos, autenticacao, perfil.
   - Shared: componentes visuais, utilitarios e estilos comuns.
   - Pages: inicializadores de tela, sem concentrar regra transversal.

4. Dependencias explicitas.
   - Substituir uso de `window.*` por imports e exports.
   - Substituir handlers inline por `addEventListener`.

## Estrutura Alvo do Backend

```text
backend/
  app/
    __init__.py
    api/
      routes/
        auth_routes.py
        user_routes.py
        event_routes.py
        subscription_routes.py
    services/
      auth_service.py
      user_service.py
      event_service.py
      subscription_service.py
    repositories/
      user_repository.py
      event_repository.py
      subscription_repository.py
    domain/
      entities.py
      schemas.py
    infra/
      db.py
      config.py
      migrations/
  run.py
  requirements.txt
```

## Estrutura Alvo do Frontend

```text
frontend/
  src/
    core/
      api/
        client.js
      auth/
        auth-service.js
        session-storage.js
      config/
        env.js
    modules/
      events/
        events-service.js
        events-controller.js
        events-view.js
      profile/
        profile-service.js
        profile-controller.js
      auth/
        login-controller.js
        register-controller.js
    shared/
      components/
      utils/
      styles/
    pages/
      home/
      login/
      cadastro/
      area-usuario/
      area-instituicao/
      criar-evento/
```

## Refatoracao Prioritaria

### Fase 1 - Limpeza Estrutural

Objetivo: reduzir confusao arquitetural sem alterar regra de negocio.

1. Corrigir o README raiz para refletir Flask como backend oficial.
2. Remover ou arquivar `backend/src/` se nao houver uso real.
3. Remover arquivos vazios ou placeholder sem funcao clara.
4. Padronizar nomes de pastas do frontend sem acento, espacos ou extensoes em nomes de diretorio.
5. Consolidar a configuracao de API do frontend em um unico modulo.

### Fase 2 - Desacoplamento do Backend

Objetivo: quebrar o monolito logico de `app.py` e `models.py`.

1. Criar `create_app()` e registrar blueprints.
2. Mover validacoes de payload para schemas/validators.
3. Extrair regras de negocio para services.
4. Extrair SQL e persistencia para repositories.
5. Mover `ensure_*` e ajustes de schema para scripts de migracao.
6. Deixar `models.py` apenas como entidades ou dividir em `domain/entities.py`.

### Fase 3 - Desacoplamento do Frontend

Objetivo: reduzir dependencia de globais e separar comportamento de interface.

1. Substituir `window.apiFetch` por modulo importavel.
2. Substituir `window.Auth` por servico de autenticacao.
3. Remover `onclick`, `oninput` e `onsubmit` inline das paginas.
4. Criar inicializadores por pagina que registrem listeners localmente.
5. Isolar mocks e eventos demonstrativos atras de uma flag de ambiente.
6. Centralizar funcoes utilitarias repetidas, como mascaras e formatadores.

### Fase 4 - Endurecimento da Arquitetura

Objetivo: impedir regressao estrutural.

1. Definir convencoes de nomes e organizacao no README tecnico.
2. Adicionar testes para services do backend.
3. Adicionar checagens basicas de lint/formatacao.
4. Documentar fluxo de dependencia entre camadas.

## Ordem Recomendada de Execucao

1. Limpar stack duplicada e corrigir documentacao.
2. Refatorar backend para `create_app`, routes, services e repositories.
3. Refatorar frontend para modulos ES e listeners explicitos.
4. Padronizar nomes e componentes compartilhados.
5. Adicionar testes e checks de qualidade.

## Ganhos Esperados

1. Menor impacto em cascata ao mudar banco, regra de negocio ou interface.
2. Maior previsibilidade para onboard de novos integrantes.
3. Reducao de bugs causados por dependencias implicitas.
4. Facilidade maior para testar backend e frontend por unidade.
5. Base mais segura para adicionar tickets, inscricoes, pagamentos e painel administrativo.

## Itens Que Nao Devem Permanecer Como Estao

1. `backend/app.py` como concentrador de todo o backend.
2. `backend/models.py` como arquivo unico para dominio, SQL e migracao.
3. `window.*` como mecanismo principal de integracao entre scripts.
4. HTML com comportamento embutido por atributos inline.
5. Documentacao raiz descrevendo tecnologia diferente da usada em producao local.

## Resultado Esperado ao Final

Ao final da refatoracao, cada alteracao deve seguir um fluxo claro:

- rota recebe dados e delega
- service decide regra de negocio
- repository persiste ou consulta
- frontend consome API por modulo dedicado
- pagina apenas inicializa interface e eventos

Isso reduz acoplamento tecnico e tambem reduz dependencia de conhecimento informal sobre o projeto.