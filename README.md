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

## Testes

O Vitest roda com jsdom e `@testing-library/react`. A configuração global fica em
`src/test/setup.js`; os arquivos de teste ficam ao lado do código que cobrem
(`*.test.jsx` / `*.test.js`).