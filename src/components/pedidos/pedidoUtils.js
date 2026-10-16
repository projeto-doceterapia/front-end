export const STATUS_PEDIDO = {
  ORCAMENTO: 'Orçamento',
  ESPERANDO_FAZER: 'Aguardando produção',
  EM_PRODUCAO: 'Em produção',
  AGUARDANDO_SINAL: 'Aguardando sinal',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_ENTREGA: 'Aguardando entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export function dataPedido(pedido) {
  return String(pedido.dataEntrega || '').slice(0, 10)
}

export function formatarData(data) {
  if (!data) return 'Sem data'
  const [ano, mes, dia] = dataPedido({ dataEntrega: data }).split('-')
  return ano && mes && dia ? `${dia}/${mes}` : data
}

export function nomeCliente(pedido, clientes) {
  if (pedido.nomeCliente || pedido.clienteNome) return pedido.nomeCliente || pedido.clienteNome
  const idCliente = Number(pedido.clienteId ?? pedido.fkCliente)
  return clientes.find((cliente) => Number(cliente.idCliente) === idCliente)?.nome || 'Cliente não identificado'
}

export function produtosDoPedido(pedido, itens, produtos) {
  return itens
    .filter((item) => Number(item.fkPedido) === Number(pedido.idPedido))
    .map((item) => {
      const produto = produtos.find((registro) => Number(registro.idProduto) === Number(item.fkProduto))
      return produto ? `${produto.nome} ×${item.quantidade || 1}` : ''
    })
    .filter(Boolean)
}

export function totalPedido(pedido, itens, pagamentos) {
  const pagamento = pagamentos.find((registro) => Number(registro.pedidoId ?? registro.fkPedido) === Number(pedido.idPedido))
  if (pagamento?.valorTotal != null) return Number(pagamento.valorTotal)

  return itens
    .filter((item) => Number(item.fkPedido) === Number(pedido.idPedido))
    .reduce((total, item) => total + Number(item.valorTotal ?? Number(item.valorUnitario || 0) * Number(item.quantidade || 1)), 0)
}

export function dinheiro(valor) {
  return `R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function textoStatus(status) {
  return STATUS_PEDIDO[status] || String(status || 'Sem etapa').replaceAll('_', ' ')
}