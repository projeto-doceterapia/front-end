import { ClipboardList, Edit3, Minus, Plus, Trash2 } from 'lucide-react'

export default function Carrinho({ itens, total, dinheiro, aoRemover, aoAlterarQuantidade }) {
  return (
    <aside className="cart-panel order-panel">
      <header><span className="panel-icon"><ClipboardList size={17} /></span><h2>Itens do pedido</h2><b className="cart-count">{itens.length}</b></header>
      <div className="cart-items">
        {itens.map((item) => <Item item={item} dinheiro={dinheiro} aoRemover={() => aoRemover(item.produto.idProduto)} aoAlterarQuantidade={aoAlterarQuantidade} key={item.produto.idProduto} />)}
      </div>
      <footer>Subtotal <strong>{dinheiro(total)}</strong></footer>
    </aside>
  )
}

function Item({ item, dinheiro, aoRemover, aoAlterarQuantidade }) {
  const totalItem = Number(item.produto.precoAtual) * item.quantidade
  return (
    <article>
      <div><strong>{item.produto.nome}</strong><span><Edit3 size={15} /><button aria-label="Remover item" onClick={aoRemover}><Trash2 size={14} /></button></span></div>
      <div className="quantity">
        <button onClick={() => aoAlterarQuantidade(item.produto.idProduto, -1)}><Minus size={13} /></button>
        {item.quantidade}
        <button onClick={() => aoAlterarQuantidade(item.produto.idProduto, 1)}><Plus size={13} /></button>
        <p>{dinheiro(item.produto.precoAtual)}<b>{dinheiro(totalItem)}</b></p>
      </div>
    </article>
  )
}
