import { Check } from 'lucide-react'

export default function ResumoPedido({ itens, total, dinheiro }) {
  return (
    <section className="summary-panel order-panel">
      <header>
        <span className="panel-icon">$</span>
        <h2>Resumo do pedido</h2>
      </header>

      <div className="summary-body">
        <small>Cliente</small>
        <p>Confeitaria Doce Mel</p>
        <small>Entrega</small>
        <p>Retirada</p>
        <small>Data</small>
        <p>11/11/3000</p>

        <hr />
        <small>Itens</small>
        {itens.map((item, indice) => (
          <p className="summary-item" key={`${item[0]}${indice}`}>
            {item[0]} × 1 <b>{dinheiro(item[2])}</b>
          </p>
        ))}

        <hr />
        <p className="summary-total">Valor total <b>{dinheiro(total)}</b></p>
        <p className="summary-line">Custo estimado <span>R$ 51,00</span></p>
        <p className="summary-line profit">Margem prevista (70%) <span>{dinheiro(total - 51)}</span></p>

        <button className="primary-button confirm">
          <Check size={16} />
          Confirmar pedido
        </button>
      </div>
    </section>
  )
}
