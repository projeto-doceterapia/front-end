import { Pencil, ReceiptText } from 'lucide-react'
import { dinheiro, formatarData, nomeCliente, produtosDoPedido, textoStatus, totalPedido } from './pedidoUtils'

export default function TabelaHistoricoPedidos({ pedidos, clientes, itens, produtos, pagamentos }) {
  return (
    <div className="history-table-scroll">
      <table className="history-table">
        <thead>
          <tr><th>Código</th><th>Cliente</th><th>Produto</th><th>Entrega</th><th>Valor / Sinal</th><th>Etapa</th><th>Pagamento</th><th><span className="sr-only">Ações</span></th></tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const pagamento = pagamentos.find((registro) => Number(registro.pedidoId ?? registro.fkPedido) === Number(pedido.idPedido))
            const total = totalPedido(pedido, itens, pagamentos)
            const produtosPedido = produtosDoPedido(pedido, itens, produtos)
            const valorPago = Number(pagamento?.valorPago ?? pagamento?.valorSinal ?? 0)
            const percentualPago = total ? Math.min(100, Math.round((valorPago / total) * 100)) : pagamento?.statusPagamento === 'PAGO' ? 100 : 0

            return (
              <tr key={pedido.idPedido}>
                <td><span className="order-code">#{String(pedido.idPedido).padStart(4, '0')}</span></td>
                <td><strong>{nomeCliente(pedido, clientes)}</strong><small>{formatarData(pedido.dataCriacao || pedido.dataEntrega)}</small></td>
                <td className="history-product" title={produtosPedido.join(', ')}>{produtosPedido.join(', ') || pedido.tipoPedido || '—'}</td>
                <td>{formatarData(pedido.dataEntrega)}</td>
                <td><strong>{dinheiro(total)}</strong><div className="payment-progress"><i style={{ width: `${percentualPago}%` }} /></div><small>{percentualPago}% pago</small></td>
                <td><span className={`history-status status-${String(pedido.statusPedido || '').toLowerCase()}`}><ReceiptText size={12} />{textoStatus(pedido.statusPedido)}</span></td>
                <td><span className="payment-method">{pagamento?.formaPagamento || pagamento?.metodoPagamento || 'Pendente'}</span></td>
                <td><button className="history-edit" type="button" aria-label={`Editar pedido ${pedido.idPedido}`} title="Editar pedido"><Pencil size={15} /></button></td>
              </tr>
            )
          })}
          {!pedidos.length && <tr><td colSpan="8" className="history-empty">Nenhum pedido encontrado com esses filtros.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}