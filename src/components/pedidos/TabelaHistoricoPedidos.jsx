import { Eye, Pencil } from 'lucide-react'
import { podeCancelar } from './fluxoPedido'
import { codigoPedido, dinheiro, formatarData, nomeCliente, pagamentoDoPedido, produtosDoPedido, situacaoPagamento, textoStatus, textoStatusPagamento, totalPedido, valorPago } from './pedidoUtils'

export default function TabelaHistoricoPedidos({ pedidos, clientes, itens, produtos, pagamentos, ehDona = true, onAbrir, onEditar }) {
  const colunas = ehDona ? 8 : 6

  return (
    <div className="history-table-scroll">
      <table className={`history-table${ehDona ? '' : ' history-table-compacta'}`}>
        <thead>
          <tr>
            <th>Código</th><th>Cliente</th><th>Produto</th><th>Entrega</th>
            {ehDona && <th>Valor</th>}
            <th>Etapa</th>
            {ehDona && <th>Pagamento</th>}
            <th><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const pagamento = pagamentoDoPedido(pedido, pagamentos)
            const total = totalPedido(pedido, itens, pagamentos)
            const pago = Math.min(total, pagamento?.statusPagamento === 'PAGO_INTEGRAL' ? total : valorPago(pagamento))
            const percentualPago = total ? Math.round((pago / total) * 100) : 0
            const produtosPedido = produtosDoPedido(pedido, itens, produtos)
            const codigo = codigoPedido(pedido.idPedido)

            return (
              <tr key={pedido.idPedido}>
                <td><span className="order-code">{codigo}</span></td>
                <td><strong>{nomeCliente(pedido, clientes)}</strong><small>{formatarData(pedido.dataCriacao || pedido.dataEntrega)}</small></td>
                <td className="history-product" title={produtosPedido.join(', ')}>{produtosPedido.join(', ') || 'Pedido sem produtos'}</td>
                <td>{formatarData(pedido.dataEntrega)}</td>
                {ehDona && (
                  <td>
                    <strong>{dinheiro(total)}</strong>
                    <div className={`payment-progress ${situacaoPagamento(pago, total)}`}><i style={{ width: `${percentualPago}%` }} /></div>
                    <small>Pago {dinheiro(pago)} de {dinheiro(total)}</small>
                  </td>
                )}
                <td><span className={`order-status status-${String(pedido.statusPedido || '').toLowerCase()}`}>{textoStatus(pedido.statusPedido)}</span></td>
                {ehDona && <td><span className="payment-method">{textoStatusPagamento(pagamento?.statusPagamento)}</span></td>}
                <td>
                  <div className="history-actions">
                    <button className="history-edit" type="button" aria-label={`Ver pedido ${codigo}`} title={`Ver pedido ${codigo}`} onClick={() => onAbrir(pedido)}><Eye size={16} aria-hidden="true" /></button>
                    {podeCancelar(pedido.statusPedido) && <button className="history-edit" type="button" aria-label={`Editar pedido ${codigo}`} title={`Editar pedido ${codigo}`} onClick={() => onEditar(pedido)}><Pencil size={15} aria-hidden="true" /></button>}
                  </div>
                </td>
              </tr>
            )
          })}
          {!pedidos.length && <tr><td colSpan={colunas} className="history-empty">Nenhum pedido encontrado com esses filtros.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
