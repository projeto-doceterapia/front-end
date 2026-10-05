import { ArrowRight, CalendarDays, MessageSquare, UserRound } from 'lucide-react'
import { dataPedido, formatarData, nomeCliente, produtosDoPedido, textoStatus } from './pedidoUtils'

export default function PedidoProducaoCard({ pedido, clientes, itens, produtos, pagamento }) {
  const dataEntrega = dataPedido(pedido)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = dataEntrega ? new Date(`${dataEntrega}T00:00:00`) : null
  const dias = data ? Math.ceil((data - hoje) / 86400000) : null
  const classePrazo = dias === 0 ? 'due-today' : dias != null && dias < 0 ? 'due-late' : 'due-soon'
  const linhasProduto = produtosDoPedido(pedido, itens, produtos)
  const status = pedido.statusPedido

  return (
    <article className={`production-order ${status === 'AGUARDANDO_ENTREGA' ? 'ready-order' : ''}`}>
      <div className={`production-deadline ${classePrazo}`}>
        <strong>{dias == null ? '—' : dias < 0 ? Math.abs(dias) : dias === 0 ? '!' : dias}</strong>
        <span>{dias == null ? 'prazo' : dias < 0 ? 'atraso' : dias === 0 ? 'hoje' : dias === 1 ? 'dia' : 'dias'}</span>
      </div>
      <div className="production-order-main">
        <div className="production-tags">
          <span className="order-code">#{String(pedido.idPedido).padStart(4, '0')}</span>
          <span className={`order-status status-${String(status || '').toLowerCase()}`}>{textoStatus(status)}</span>
          {dias === 0 && <span className="order-highlight">Começar hoje</span>}
          {pagamento?.statusPagamento === 'PAGO' && <span className="order-highlight paid-tag">Pago</span>}
        </div>
        <h2>{linhasProduto.join(', ') || pedido.tipoPedido || 'Pedido sem produtos'}</h2>
        <div className="production-order-meta">
          <span><UserRound size={13} />{nomeCliente(pedido, clientes)}</span>
          <span><CalendarDays size={13} />{formatarData(dataEntrega)}</span>
          {pedido.anotacao && <span className="production-note"><MessageSquare size={13} />{pedido.anotacao}</span>}
        </div>
      </div>
      <div className="production-order-actions">
        <span className="payment-hint">{pagamento?.statusPagamento ? textoStatus(pagamento.statusPagamento) : 'Pagamento pendente'}</span>
        <button type="button" aria-label={`Abrir pedido ${pedido.idPedido}`} title="Abrir pedido">
          <ArrowRight size={17} />
        </button>
      </div>
    </article>
  )
}