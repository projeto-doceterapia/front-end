import api from './api'

// The override flag is left out of the first attempt so the API runs the supply check.
export function avancarStatus(id, statusPedido, confirmarComFalta = false) {
  const params = confirmarComFalta ? { statusPedido, confirmarComFalta: true } : { statusPedido }
  return api.patch(`/pedidos/${id}/status`, null, { params }).then((resposta) => resposta.data)
}

export function atualizarPedido(id, dados) {
  return api.put(`/pedidos/${id}`, dados).then((resposta) => resposta.data)
}

export function cancelarPedido(pedidoId, dados) {
  return api.post(`/cancelamentos/pedido/${pedidoId}`, dados).then((resposta) => resposta.data)
}
