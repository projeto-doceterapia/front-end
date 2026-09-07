import {
  CalendarDays,
  ChevronDown,
  Grid2x2,
  ShoppingBasket,
} from 'lucide-react'
import logoImage from '../assets/logo.png'

const itens = [
  { id: 'agenda', label: 'Agenda', icone: CalendarDays },
  { id: 'visao-geral', label: 'Visão Geral', icone: Grid2x2 },
  { id: 'pedidos', label: 'Pedidos', icone: ShoppingBasket, expandido: true },
]

export default function Sidebar({ telaAtual, aoNavegar }) {
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
          <button
            className={`sidebar-item ${telaAtual === id ? 'active' : ''}`}
            key={id}
            type="button"
            onClick={() => aoNavegar(id)}
            aria-current={telaAtual === id ? 'page' : undefined}
          >
            <Icone size={21} strokeWidth={1.8} />
            <span>{label}</span>
            {expandido && <ChevronDown className="sidebar-chevron" size={16} strokeWidth={1.8} />}
          </button>
        ))}
      </nav>
    </aside>
  )
}
