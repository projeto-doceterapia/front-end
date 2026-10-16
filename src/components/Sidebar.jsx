import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CookingPot,
  Grid2x2,
  Package,
  PackageCheck,
  ShoppingBasket,
  UsersRound,
} from 'lucide-react'
import logoImage from '../assets/logo.png'

const itens = [
  { id: 'visao-geral', label: 'Visão Geral', icone: Grid2x2 },
  { id: 'agenda', label: 'Agenda', icone: CalendarDays },
  { id: 'estoque', label: 'Estoque', icone: Package },
  { id: 'produtos', label: 'Produtos', icone: CookingPot },
  { id: 'pedidos', label: 'Pedidos', icone: ShoppingBasket, expandido: true },
  { id: 'clientes', label: 'Clientes', icone: UsersRound },
]

export default function Sidebar({ telaAtual, aoNavegar }) {
  const pedidosAtivos = ['pedido', 'producao', 'historico-pedidos'].includes(telaAtual)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoImage} alt="Logo Doceterapia" />
        <div>
          <strong>Doceterapia</strong>
          <span>Confeitaria</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {itens.map(({ id, label, icone: Icone, expandido }) => (
          <div className="sidebar-item-group" key={id}>
            <button
              className={`sidebar-item ${telaAtual === id || (id === 'pedidos' && pedidosAtivos) ? 'active' : ''}`}
              type="button"
              onClick={() => aoNavegar(id)}
              aria-current={telaAtual === id || (id === 'pedidos' && pedidosAtivos) ? 'page' : undefined}
            >
              <Icone size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {expandido && (
                <ChevronDown className="sidebar-chevron" size={15} strokeWidth={1.8} />
              )}
            </button>
            {expandido && (
              <div className="sidebar-submenu">
                <button type="button" className={telaAtual === 'pedido' ? 'active' : ''} onClick={() => aoNavegar('registrar-pedido')}>
                  <ClipboardList size={15} /> Registrar Pedido
                </button>
                <button type="button" className={telaAtual === 'producao' ? 'active' : ''} onClick={() => aoNavegar('producao')}>
                  <CookingPot size={15} /> Produção
                </button>
                <button type="button" className={telaAtual === 'historico-pedidos' ? 'active' : ''} onClick={() => aoNavegar('historico-pedidos')}>
                  <PackageCheck size={15} /> Histórico
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
