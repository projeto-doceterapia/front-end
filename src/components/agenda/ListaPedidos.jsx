import { Clock3, MapPin, X } from 'lucide-react'
import { pedidos } from './dadosAgenda.jsx'

export default function ListaPedidos() {
  return (
    <aside className="orders-card">
      <header>
        <div>
          <small>Pedidos</small>
          <h2>qui., 9 de abr.</h2>
        </div>
        <X size={14} />
      </header>

      <div className="order-list">
        {pedidos.map((pedido) => (
          <Pedido pedido={pedido} key={pedido[0]} />
        ))}
      </div>

      <footer>
        <span>3 pedidos</span>
        <strong>R$ 440,00</strong>
      </footer>
    </aside>
  )
}

function Pedido({ pedido }) {
  return (
    <article className="agenda-order">
      <div className="order-tags">
        <span>{pedido[0]}</span>
        <b className={pedido[8]}>◉ {pedido[1]}</b>
      </div>

      <p>{pedido[2]}</p>
      <small>♙ {pedido[3]}</small>
      <small><Clock3 size={11} /> {pedido[4]}</small>
      <small><MapPin size={11} /> {pedido[5]}</small>

      <div className="order-total">
        <span>Total</span>
        <strong>{pedido[6]}</strong>
        <span className={pedido[8]}>{pedido[7]}</span>
      </div>
    </article>
  )
}
