export const STATUS_PEDIDO = {
  ORCAMENTO: 'Orçamento',
  AGUARDANDO_SINAL: 'Aguardando sinal',
  ESPERANDO_FAZER: 'Aguardando produção',
  EM_PRODUCAO: 'Em produção',
  AGUARDANDO_ENTREGA: 'Aguardando entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const STATUS_PAGAMENTO = {
  AGUARDANDO_SINAL: 'Aguardando sinal',
  AGUARDANDO_PAGAMENTO: 'Sinal pago, restante pendente',
  PAGO_INTEGRAL: 'Pago integralmente',
}

export const FORMA_PAGAMENTO = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito',
  TRANSFERENCIA: 'Transferência',
}

export function dataPedido(pedido) {
  return String(pedido.dataEntrega || '').slice(0, 10)
}

export function formatarData(data) {
  if (!data) return 'Sem data'
  const [ano, mes, dia] = dataPedido({ dataEntrega: data }).split('-')
  return ano && mes && dia ? `${dia}/${mes}` : data
}

export function formatarDataCompleta(data) {
  const [ano, mes, dia] = String(data || '').slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : 'Sem data'
}

// Mirrors the server rounding (half up to the cent); only for the quote preview, never for registered values.
export function sinalPrevisto(total) {
  return Math.round(Number(total || 0) * 50) / 100
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
export function textoStatusPagamento(status) {
  return STATUS_PAGAMENTO[status] || 'Pagamento pendente'
}

export function pagamentoDoPedido(pedido, pagamentos) {
  return pagamentos.find((registro) => Number(registro.pedidoId ?? registro.fkPedido) === Number(pedido.idPedido))
}

export function valorPago(pagamento) {
  if (!pagamento) return 0
  if (pagamento.statusPagamento === 'PAGO_INTEGRAL') return Number(pagamento.valorTotal || 0)
  if (pagamento.statusPagamento === 'AGUARDANDO_PAGAMENTO') return Number(pagamento.valorSinal || 0)
  return 0
}

export function textoFormaPagamento(pagamento) {
  const forma = pagamento?.formaPagamentoRestante || pagamento?.formaPagamentoSinal
  return forma ? FORMA_PAGAMENTO[forma] || forma : 'Pendente'
}

export function codigoPedido(idPedido) {
  return `#${String(idPedido).padStart(4, '0')}`
}

export function substituirPedido(pedidos, atualizado) {
  return pedidos.map((pedido) => (Number(pedido.idPedido) === Number(atualizado.idPedido) ? { ...pedido, ...atualizado } : pedido))
}
