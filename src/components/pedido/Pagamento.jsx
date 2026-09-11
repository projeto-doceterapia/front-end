import { CreditCard } from 'lucide-react'

export default function Pagamento({ total, dinheiro, dados, aoAlterar }) {
  return (
    <section className="payment-panel order-panel">
      <header><span className="panel-icon"><CreditCard size={17} /></span><h2>Pagamento</h2></header>
      <div className="payment-body">
        <label>Forma de pagamento
          <select name="formaPagamento" value={dados.formaPagamento} onChange={aoAlterar}>
            <option value="PIX">Pix</option><option value="DINHEIRO">Dinheiro</option><option value="CARTAO_CREDITO">Cartao de credito</option><option value="CARTAO_DEBITO">Cartao de debito</option><option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </label>
        <div className="payment-values"><span>Sinal (50%) <b>{dinheiro(total / 2)}</b></span><span>Saldo restante <strong>{dinheiro(total / 2)}</strong></span></div>
        <label>Observacoes finais<textarea name="anotacao" value={dados.anotacao} onChange={aoAlterar} placeholder="Notas adicionais sobre o pedido..." /></label>
      </div>
    </section>
  )
}
