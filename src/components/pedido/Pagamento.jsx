import { CreditCard } from 'lucide-react'
import { sinalPrevisto } from '../pedidos/pedidoUtils'

export default function Pagamento({ total, dinheiro, dados, aoAlterar }) {
  const sinal = sinalPrevisto(total)

  return (
    <section className="payment-panel order-panel">
      <header><span className="panel-icon"><CreditCard size={17} /></span><h2>Pagamento</h2></header>
      <div className="payment-body">
        <div className="payment-values"><span>Sinal previsto (50%) <b>{dinheiro(sinal)}</b></span><span>Restante previsto <strong>{dinheiro(Number(total || 0) - sinal)}</strong></span></div>
        <p className="payment-hint">A forma de pagamento é registrada em cada parcela depois que o pedido é confirmado.</p>
        <label>Observações finais<textarea name="anotacao" value={dados.anotacao} onChange={aoAlterar} placeholder="Notas adicionais sobre o pedido..." /></label>
      </div>
    </section>
  )
}
