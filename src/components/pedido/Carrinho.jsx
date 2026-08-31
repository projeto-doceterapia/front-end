import { ClipboardList, Edit3, Minus, Plus, Trash2 } from 'lucide-react'

export default function Carrinho({ itens, total, dinheiro, aoRemover }) {
  return (
    <aside className="cart-panel order-panel">
      <header>
        <span className="panel-icon"><ClipboardList size={17} /></span>
        <h2>Itens do pedido</h2>
        <b className="cart-count">{itens.length}</b>
      </header>

      <div className="cart-items">
        {itens.map((item, indice) => (
          <Item item={item} dinheiro={dinheiro} aoRemover={() => aoRemover(indice)} key={`${item[0]}${indice}`} />
        ))}
      </div>

      <footer>Subtotal <strong>{dinheiro(total)}</strong></footer>
    </aside>
  )
}

function Item({ item, dinheiro, aoRemover }) {
  return (
    <article>
      <div>
        <strong>{item[0]}</strong>
        <span>
          <Edit3 size={15} />
          <button aria-label="Remover item" onClick={aoRemover}><Trash2 size={14} /></button>
        </span>
      </div>

      <div className="quantity">
        <button><Minus size={13} /></button>
        1
        <button><Plus size={13} /></button>
        <p>{dinheiro(item[2])}<b>{dinheiro(item[2])}</b></p>
      </div>
    </article>
  )
}
