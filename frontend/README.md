# Frontend EventoCom

O frontend esta em HTML, CSS e JavaScript, com refatoracao gradual para modulos ES.

## Organizacao Atual

```text
frontend/src/
	core/
		api/     Cliente HTTP compartilhado
		auth/    Servico de autenticacao e sessao
	pages/     Scripts e telas por pagina
```

## Estado da Refatoracao

- `login` e `cadastro` ja usam modulos ES.
- `login` e `cadastro` nao dependem mais de `window.Auth` e `window.apiFetch`.
- `login` e `cadastro` nao usam mais handlers inline em HTML.
- `home` ja usa modulo ES com controle de modal e inscricao sem script inline.
- `home` nao usa mais `window.Auth`, `window.apiFetch` ou handlers inline no HTML.
- `areausuariofisico`, `areausuarioinst` e `criarevento` usam `authService` e `apiFetch` modulares.
- `areapublicainst` tambem foi migrada para consumo de modulos ES.
- os arquivos legados `src/auth.js` e `src/services/api.js` foram removidos.

## Proximo Passo

Remover gradualmente handlers inline restantes nas telas de area do usuario e criacao de evento, trocando para event listeners via `addEventListener`.
