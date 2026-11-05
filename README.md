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

## Avisos e confirmação

Componentes compartilhados em `src/components/feedback/`. O `ToastProvider` já está montado em
`src/main.jsx`, por fora do `App`, então vale também para a tela de login.

**Toast** — retorno de uma ação disparada pela usuária (salvar, registrar, excluir, mudar fase):

```jsx
import useToast from '../../components/feedback/useToast'

const toast = useToast()
toast.sucesso('Cliente salvo.')
toast.erro('Não foi possível salvar o cliente. Tente novamente.')
```

- `sucesso` some em 5 segundos e pausa com o mouse ou o foco sobre o aviso.
- `erro` fica na tela até ser fechado.
- Aparecem no máximo 5 avisos; ao passar disso, sai o mais antigo.
- Validação de campo e erro de carregamento da tela continuam embutidos na tela.
- Enquanto um `<dialog>` nativo estiver aberto, a página por baixo fica inerte e o toast não
  responde: mostre o erro dentro do modal e use o toast depois de fechá-lo.

**Diálogo de confirmação** — antes de uma ação sem volta:

```jsx
import ConfirmDialog from '../../components/feedback/ConfirmDialog'

<ConfirmDialog
  aberto={confirmando}
  titulo="Marcar como entregue?"
  mensagem="Essa fase não volta."
  textoConfirmar="Marcar como entregue"
  perigoso
  ocupado={salvando}
  onConfirm={confirmar}
  onCancel={() => setConfirmando(false)}
/>
```

| Prop | Padrão | Uso |
|---|---|---|
| `aberto` | — | `false` não renderiza nada; quem usa fecha o diálogo depois de `onConfirm` |
| `titulo` | — | Nome do diálogo |
| `mensagem` | — | Texto ou nó React (por exemplo, uma lista) |
| `textoConfirmar` | `'Confirmar'` | Texto do botão de confirmar |
| `textoCancelar` | `'Cancelar'` | Texto do botão de cancelar |
| `perigoso` | `false` | Botão de confirmar destrutivo e foco inicial no Cancelar |
| `ocupado` | `false` | Enquanto a chamada roda: bloqueia os botões, o `Esc` e o clique no fundo |
| `onConfirm` | — | Clique em confirmar |
| `onCancel` | — | Cancelar, `Esc` ou clique no fundo |

O diálogo prende o foco, fecha com `Esc`, devolve o foco a quem o abriu e pode ser usado dentro de
um `<dialog>` nativo sem fechá-lo junto.

**Testes** — telas que usam o hook precisam do provider. Use o helper
`src/test/renderComToast.jsx` no lugar do `render`:

```jsx
import renderComToast from '../../test/renderComToast'

renderComToast(<Clientes />)
```

## Sessão

O login usa o cookie `authToken` (`HttpOnly`), que só o servidor cria e apaga; o front não guarda
token. O `SessaoProvider` fica em `src/main.jsx`, dentro do `ToastProvider`, e a tela usa o hook:

```jsx
import useSessao from '../../components/sessao/useSessao'

const { usuario, perfil, ehDona, carregando, entrar, sair } = useSessao()
```

| Campo | Valor |
|---|---|
| `usuario` | `{ id, nome, email, perfil? }` ou `null` |
| `perfil` | `usuario.perfil`; se o campo não vier, `'DONA'`; sem usuário, `null` |
| `ehDona` | `perfil === 'DONA'`; sem usuário, `false` |
| `carregando` | `true` só durante a checagem inicial |
| `entrar(email, senha)` | Promise; rejeita com o erro do axios, e quem chamou mostra a mensagem |
| `sair()` | Promise que não rejeita; ela mesma avisa por toast quando falha |

O hook só esconde controles na tela; quem nega o acesso é o back-end.

| Situação | O que acontece |
|---|---|
| App abre ou recarrega | "Verificando sessão..." e `GET /usuarios/me` uma vez: 200 mantém a usuária logada; 401 ou falha leva ao login, sem aviso |
| Login certo | `POST /usuarios/login`, depois `GET /usuarios/me`, e abre na Agenda |
| Login recusado (4xx) | Toast "E-mail ou senha inválidos. Tente novamente."; continua no login |
| Servidor fora (sem resposta ou 5xx) | Toast "Não foi possível entrar agora. Tente novamente em instantes." |
| `/usuarios/me` falha logo depois do login | Toast "Não foi possível iniciar a sessão. Tente novamente."; continua no login |
| "Sair", resposta 204 ou 401 | Volta ao login e fecha o fluxo de notificações |
| "Sair", sem resposta ou 5xx | Continua logada, porque o cookie segue válido, e vê "Não foi possível sair. Tente novamente." |
| 401 em qualquer outra rota | Volta ao login com um único "Sua sessão expirou. Entre novamente." e nenhuma nova requisição |

O interceptor fica em `src/services/api.js` e ignora o 401 de `/usuarios/login`, `/usuarios/me` e
`/usuarios/logout`, que quem chamou trata. O `EventSource` de `/notificacoes/stream` só abre com
usuário logado, porque a topbar só monta nesse caso, e fecha quando ela desmonta.

O cookie é `SameSite=Strict`: abra o front e a API no mesmo host (`localhost`). Em
`127.0.0.1:5173` com a API em `localhost:8080`, o login responde 200, o cookie não volta e aparece
"Não foi possível iniciar a sessão". As origens aceitas pelo CORS são as do back-end.

**Testes** — `src/test/apiFalsa.js` responde pela instância real do axios, então o interceptor roda
como em produção. Telas com `useSessao` podem usar `vi.mock` do módulo, informando `usuario`,
`perfil`, `ehDona` e `sair`, ou montar o `SessaoProvider` dentro do `ToastProvider`.

## Testes

O Vitest roda com jsdom e `@testing-library/react`. A configuração global fica em
`src/test/setup.js`; os arquivos de teste ficam ao lado do código que cobrem
(`*.test.jsx` / `*.test.js`).