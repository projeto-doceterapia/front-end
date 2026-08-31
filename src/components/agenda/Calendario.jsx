import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dias, pedidosPorDia } from './dadosAgenda.jsx'

export default function Calendario() {
  return (
    <div className="calendar-card">
      <header className="calendar-header">
        <div>
          <h2>Abril</h2>
          <small>2026</small>
        </div>

        <div className="calendar-actions">
          <ChevronLeft size={16} />
          <button>Hoje</button>
          <ChevronRight size={16} />
        </div>
      </header>

      <div className="weekdays">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
          <span key={dia}>{dia}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {dias.map((dia, indice) => (
          <Dia dia={dia} pedido={pedidosPorDia[dia]} key={indice} />
        ))}
      </div>

      <footer className="calendar-footer">
        Farol: <span className="legend-free" /> até 1 pedido
        <span className="legend-warning" /> até 3 pedidos
        <span className="legend-full" /> acima de 3 — lotado
      </footer>
    </div>
  )
}

function Dia({ dia, pedido }) {
  let classe = 'calendar-day'

  if (pedido) {
    classe += ` ${pedido[2]}`
  }

  if (dia === '9') {
    classe += ' selected'
  }

  return (
    <div className={classe}>
      {dia && <span className="day-number">{dia === '9' ? <b>{dia}</b> : dia}</span>}

      {pedido && (
        <div className="day-order">
          <strong><em /> {pedido[0]} {pedido[0] === '1' ? 'Pedido' : 'Pedidos'}</strong>
          <small>{pedido[1]}</small>
        </div>
      )}
    </div>
  )
}
