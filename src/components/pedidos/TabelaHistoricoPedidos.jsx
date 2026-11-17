import { Pencil, ReceiptText } from 'lucide-react'
import { podeCancelar } from './fluxoPedido'
import { codigoPedido, dinheiro, formatarData, nomeCliente, pagamentoDoPedido, produtosDoPedido, textoFormaPagamento, textoStatus, totalPedido, valorPago } from './pedidoUtils'

export default function TabelaHistoricoPedidos({ pedidos, clientes, itens, produtos, pagamentos, onAbrir, onEditar }) {
  return (
    <div className="history-table-scroll">
      <table className="history-table">
        <thead>
          <tr><th>Código</th><th>Cliente</th><th>Produto</th><th>Entrega</th><th>Valor / Sinal</th><th>Etapa</th><th>Pagamento</th><th><span className="sr-only">Ações</span></th></tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const pagamento = pagamentoDoPedido(pedido, pagamentos)
            const total = totalPedido(pedido, itens, pagamentos)
            const produtosPedido = produtosDoPedido(pedido, itens, produtos)
            const percentualPago = total ? Math.min(100, Math.round((valorPago(pagamento) / total) * 100)) : pagamento?.statusPagamento === 'PAGO_INTEGRAL' ? 100 : 0

            return (
              <tr key={pedido.idPedido}>
                <td><button type="button" className="order-code history-open" aria-label={`Ver pedido ${pedido.idPedido}`} onClick={() => onAbrir(pedido)}>{codigoPedido(pedido.idPedido)}</button></td>
                <td><strong>{nomeCliente(pedido, clientes)}</strong><small>{formatarData(pedido.dataCriacao || pedido.dataEntrega)}</small></td>
                <td className="history-product" title={produtosPedido.join(', ')}>{produtosPedido.join(', ') || pedido.tipoPedido || '—'}</td>
                <td>{formatarData(pedido.dataEntrega)}</td>
                <td><strong>{dinheiro(total)}</strong><div className="payment-progress"><i style={{ width: `${percentualPago}%` }} /></div><small>{percentualPago}% pago</small></td>
                <td><span className={`history-status status-${String(pedido.statusPedido || '').toLowerCase()}`}><ReceiptText size={12} />{textoStatus(pedido.statusPedido)}</span></td>
                <td><span className="payment-method">{textoFormaPagamento(pagamento)}</span></td>
                <td>{podeCancelar(pedido.statusPedido) && <button className="history-edit" type="button" aria-label={`Editar pedido ${pedido.idPedido}`} title="Editar pedido" onClick={() => onEditar(pedido)}><Pencil size={15} /></button>}</td>
              </tr>
            )
          })}
          {!pedidos.length && <tr><td colSpan="8" className="history-empty">Nenhum pedido encontrado com esses filtros.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}