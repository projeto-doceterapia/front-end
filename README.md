# Doceterapia — Front-end

React 19 SPA (Vite) for managing orders, production, supplies (estoque) and
notifications. HTTP goes through the axios instance in `src/services/api.js`
(cookie-based auth). Navigation is state-based in `App.jsx`; there is no router.

## Scripts

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` (http://localhost:5173) |
| Build | `npm run build` |
| Lint | `npm run lint` (oxlint) |
| Preview build | `npm run preview` |
| Tests | `npm test` (Vitest + Testing Library, jsdom) |

API base URL comes from `VITE_API_URL` (default `http://localhost:8080`).

## Notifications

The topbar shows unread notifications loaded from `/notificacoes/nao-lidas` and
updates live over a Server-Sent Events stream (`/notificacoes/stream`). The
stream uses `EventSource` instead of axios — an approved exception kept in
`src/services/notificacoes.js`.

## Tests

Vitest runs with jsdom and `@testing-library/react`. The global setup is
`src/test/setup.js`; test files live next to the code they cover
(`*.test.jsx` / `*.test.js`).
