import { Clock3, MapPin } from 'lucide-react'

export default function ListaPedidos({ pedidos, pagamentos, itens, produtos, dataSelecionada }) {
  const pedidosDoDia = pedidos.filter((pedido) => pedido.dataEntrega === dataSelecionada)
  const total = pedidosDoDia.reduce((soma, pedido) => soma + totalPedido(pedido, pagamentos, itens), 0)
  const titulo = dataSelecionada ? new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Selecione um dia'

  return (
    <aside className="orders-card">
      <header><div><small>Pedidos do dia</small><h2>{titulo}</h2></div><span className="selected-orders-count">{pedidosDoDia.length}</span></header>
      <div className="order-list">
        {pedidosDoDia.map((pedido) => <Pedido pedido={pedido} pagamento={pagamentos.find((item) => item.pedidoId === pedido.idPedido)} itens={itens} produtos={produtos} key={pedido.idPedido} />)}
        {!pedidosDoDia.length && <p className="empty-orders">Nenhum pedido para esta data.</p>}
      </div>
      <footer><span>{pedidosDoDia.length} pedidos</span><strong>{dinheiro(total)}</strong></footer>
    </aside>
  )
}

function Pedido({ pedido, pagamento, itens, produtos }) {
  const itensPedido = itens.filter((item) => item.fkPedido === pedido.idPedido)
  const nomesProdutos = listarProdutos(itensPedido, produtos)
  const classe = pedido.statusPedido === 'AGUARDANDO_ENTREGA' ? 'delivery' : pedido.statusPedido === 'AGUARDANDO_SINAL' ? 'signal' : 'payment'
  const total = totalPedido(pedido, pagamento ? [pagamento] : [], itens)

  return (
    <article className="agenda-order">
      <div className="order-tags"><span>#{pedido.idPedido}</span><b className={classe}>{textoStatus(pedido.statusPedido)}</b></div>
      <p>{nomesProdutos.join(', ') || pedido.tipoPedido.replaceAll('_', ' ')}</p>
      <small>Cliente: {pedido.nomeCliente}</small>
      <small><Clock3 size={11} /> Entrega em {formatarData(pedido.dataEntrega)}</small>
      <small><MapPin size={11} /> {pedido.formaEntrega === 'ENTREGA' ? pedido.enderecoEntrega : 'Retirada'}</small>
      <div className="order-total"><span>Total</span><strong>{dinheiro(total)}</strong><span className={classe}>{pagamento?.statusPagamento ? textoStatus(pagamento.statusPagamento) : textoStatus(pedido.statusPedido)}</span></div>
    </article>
  )
}

function listarProdutos(itensPedido, produtos) {
  const contagem = new Map()

  itensPedido.forEach((item) => {
    const produto = produtos.find((registro) => registro.idProduto === item.fkProduto)
    if (!produto) return

    const nome = produto.nome
    contagem.set(nome, (contagem.get(nome) || 0) + Number(item.quantidade || 1))
  })

  return Array.from(contagem.entries()).map(([nome, quantidade]) => quantidade > 1 ? `${quantidade}x ${nome}` : nome)
}

function totalPedido(pedido, pagamentos, itens) {
  const pagamento = pagamentos.find((item) => item.pedidoId === pedido.idPedido)
  if (pagamento?.valorTotal) return Number(pagamento.valorTotal)
  return itens.filter((item) => item.fkPedido === pedido.idPedido).reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)
}

function dinheiro(valor) { return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function formatarData(data) { return data ? new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR') : 'Data não informada' }
function textoStatus(status) {
  const valor = (status || '').replaceAll('_', ' ').trim()
  if (!valor) return ''

  return valor
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase())
    .replace(/Orcamento\b/gi, 'Orçamento')
}
