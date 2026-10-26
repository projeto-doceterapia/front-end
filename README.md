# Doceterapia — Front-end

SPA em React 19 (Vite) para gerenciar pedidos, produção, insumos (estoque) e
notificações. As requisições HTTP passam pela instância axios em `src/services/api.js`
(autenticação baseada em cookie). A navegação é baseada em estado no `App.jsx`; não há router.

## Scripts

| Tarefa | Comando |
|---|---|
| Instalar | `npm ci` |
| Servidor de desenvolvimento | `npm run dev` (http://localhost:5173) |
| Build | `npm run build` |
| Lint | `npm run lint` (oxlint) |
| Preview do build | `npm run preview` |
| Testes | `npm test` (Vitest + Testing Library, jsdom) |

A URL base da API vem de `VITE_API_URL` (padrão `http://localhost:8080`).

## Notificações

A topbar exibe as notificações não lidas carregadas de `/notificacoes/nao-lidas` e
atualiza em tempo real por um fluxo de Server-Sent Events (`/notificacoes/stream`). O
fluxo usa `EventSource` em vez de axios — uma exceção aprovada mantida em
`src/services/notificacoes.js`.

## Testes

O Vitest roda com jsdom e `@testing-library/react`. A configuração global fica em
`src/test/setup.js`; os arquivos de teste ficam ao lado do código que cobrem
(`*.test.jsx` / `*.test.js`).