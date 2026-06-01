# 🍰 Doceterapia — Frontend

Interface web do sistema de gestão da Doceterapia, desenvolvida em React com Vite, inicialmente.

---

## Tecnologias

- **React** 18 — biblioteca de interface
- **TypeScript** — tipagem estática
- **Vite** — bundler e servidor de desenvolvimento
- **Tailwind CSS** v4 — estilização utilitária
- **React Router** v7 — roteamento
- **Lucide React** — ícones

---

## Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- npm v9 ou superior

---

## Instalação e execução

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/doceterapia-frontend.git
cd doceterapia-frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção em `/dist` |
| `npm run preview` | Visualiza o build de produção localmente |

---

## Estrutura de pastas

```
src/
├── assets/          # Imagens e arquivos estáticos
├── app/
│   ├── pages/       # Telas da aplicação
│   ├── components/  # Componentes reutilizáveis
│   ├── App.tsx      # Componente raiz
│   └── routes.tsx   # Definição de rotas
└── styles/
    ├── index.css    # Entrada de estilos
    ├── fonts.css    # Importação de fontes
    ├── tailwind.css # Configuração do Tailwind
    └── theme.css    # Tokens de design (cores, tipografia)
```

---

## Telas implementadas

- [x] Login
- [ ] Dashboard
- [ ] Agenda
- [ ] Estoque
- [ ] Produtos
- [ ] Pedidos
- [ ] Clientes
