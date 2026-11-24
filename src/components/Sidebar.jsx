import {
  CalendarDays,
  ChefHat,
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
import { NOME_NEGOCIO } from './identidade'

const itens = [
  { id: 'visao-geral', label: 'Visão Geral', icone: Grid2x2 },
  { id: 'agenda', label: 'Agenda', icone: CalendarDays },
  { id: 'producao', label: 'Produção', icone: ChefHat },
  { id: 'clientes', label: 'Clientes', icone: UsersRound },
  { id: 'pedidos', label: 'Pedidos', icone: ShoppingBasket, expandido: true },
  { id: 'produtos', label: 'Produtos', icone: CookingPot },
  { id: 'estoque', label: 'Estoque', icone: Package },
]

const subitensPedidos = [
  { id: 'registrar-pedido', tela: 'pedido', label: 'Registrar Pedido', icone: ClipboardList },
  { id: 'historico-pedidos', tela: 'historico-pedidos', label: 'Histórico', icone: PackageCheck },
]

export default function Sidebar({ telaAtual, aoNavegar }) {
  const pedidosAtivos = ['pedido', 'historico-pedidos'].includes(telaAtual)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoImage} alt="Logo Doceterapia" />
        <div>
          <strong>{NOME_NEGOCIO}</strong>
          <span>Confeitaria</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {itens.map(({ id, label, icone: Icone, expandido }) => {
          const ativo = telaAtual === id || (id === 'pedidos' && pedidosAtivos)
          return (
            <div className="sidebar-item-group" key={id}>
              <button
                className={`sidebar-item ${ativo ? 'active' : ''}`}
                type="button"
                onClick={() => aoNavegar(id)}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icone size={19} strokeWidth={1.8} aria-hidden="true" />
                <span className="sidebar-rotulo">{label}</span>
                {expandido && (
                  <ChevronDown className="sidebar-chevron" size={15} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
              {expandido && (
                <div className="sidebar-submenu">
                  {subitensPedidos.map(({ id: subId, tela, label: subLabel, icone: SubIcone }) => (
                    <button
                      key={subId}
                      type="button"
                      className={telaAtual === tela ? 'active' : ''}
                      onClick={() => aoNavegar(subId)}
                      aria-current={telaAtual === tela ? 'page' : undefined}
                    >
                      <SubIcone size={15} aria-hidden="true" />
                      <span className="sidebar-rotulo">{subLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
