import { useState, useSyncExternalStore } from 'react'
import {
  CalendarDays,
  ChefHat,
  ChevronDown,
  ClipboardList,
  CookingPot,
  Grid2x2,
  Package,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
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

const CHAVE_RECOLHIDO = 'doceterapia-menu-recolhido'
const TELA_ESTREITA = '(max-width: 760px)'

function assinarLargura(aoMudar) {
  const consulta = window.matchMedia?.(TELA_ESTREITA)
  consulta?.addEventListener('change', aoMudar)
  return () => consulta?.removeEventListener('change', aoMudar)
}

function telaEstreita() {
  return window.matchMedia?.(TELA_ESTREITA).matches ?? false
}

// Storage can be blocked (private mode, policies); the menu then just starts expanded.
function lerRecolhido() {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDO) === 'true'
  } catch {
    return false
  }
}

function salvarRecolhido(valor) {
  try {
    localStorage.setItem(CHAVE_RECOLHIDO, String(valor))
  } catch {
    // The preference only lasts for this visit.
  }
}

export default function Sidebar({ telaAtual, aoNavegar }) {
  const pedidosAtivos = ['pedido', 'historico-pedidos'].includes(telaAtual)
  const estreita = useSyncExternalStore(assinarLargura, telaEstreita)
  const [recolhido, setRecolhido] = useState(lerRecolhido)
  const compacta = estreita || recolhido

  function alternar() {
    setRecolhido(!recolhido)
    salvarRecolhido(!recolhido)
  }

  return (
    <aside className={`sidebar ${compacta ? 'recolhida' : ''}`}>
      <div className="sidebar-brand">
        <img src={logoImage} alt="Logo Doceterapia" />
        <div>
          <strong>{NOME_NEGOCIO}</strong>
          <span>Confeitaria</span>
        </div>
      </div>
      {!estreita && (
        <button
          type="button"
          className="sidebar-toggle"
          onClick={alternar}
          aria-expanded={!recolhido}
          aria-controls="sidebar-nav"
          aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
          title={recolhido ? 'Expandir menu' : 'Recolher menu'}
        >
          {recolhido ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      )}
      <nav id="sidebar-nav" className="sidebar-nav" aria-label="Navegação principal">
        {itens.map(({ id, label, icone: Icone, expandido }) => {
          const ativo = telaAtual === id || (id === 'pedidos' && pedidosAtivos)
          return (
            <div className="sidebar-item-group" key={id}>
              <button
                className={`sidebar-item ${ativo ? 'active' : ''}`}
                type="button"
                onClick={() => aoNavegar(id)}
                aria-current={ativo ? 'page' : undefined}
                title={compacta ? label : undefined}
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
                      title={compacta ? subLabel : undefined}
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
