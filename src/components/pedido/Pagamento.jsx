import { CreditCard } from 'lucide-react'

export default function Pagamento({ total, dinheiro }) {
  return (
    <section className="payment-panel order-panel">
      <header>
        <span className="panel-icon"><CreditCard size={17} /></span>
        <h2>Pagamento</h2>
      </header>

      <div className="payment-body">
        <label>
          Forma de pagamento
          <select defaultValue="pix">
            <option value="pix">Pix</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
          </select>
        </label>

        <label className="check-label"><input type="checkbox" defaultChecked /> Sinal de 50%</label>

        <div className="payment-values">
          <span>Sinal (50%) <b>{dinheiro(total / 2)}</b></span>
          <span>Saldo restante <strong>{dinheiro(total / 2)}</strong></span>
        </div>

        <label>
          Status inicial
          <select defaultValue="signal">
            <option value="signal">Aguardando sinal de 50%</option>
            <option>Aguardando pagamento</option>
          </select>
        </label>

        <label>
          Observações finais
          <textarea placeholder="Notas adicionais sobre o pedido..." />
        </label>
      </div>
    </section>
  )
}
