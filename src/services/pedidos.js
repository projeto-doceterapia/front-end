import api from './api'

export function avancarStatus(id, statusPedido) {
  return api.patch(`/pedidos/${id}/status`, null, { params: { statusPedido } }).then((resposta) => resposta.data)
}

export function atualizarPedido(id, dados) {
  return api.put(`/pedidos/${id}`, dados).then((resposta) => resposta.data)
}

export function cancelarPedido(pedidoId, dados) {
  return api.post(`/cancelamentos/pedido/${pedidoId}`, dados).then((resposta) => resposta.data)
}
