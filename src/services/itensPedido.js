import api from './api'

// The override flag is left out of the first attempt so the API runs the supply check.
function opcoes(confirmarComFalta) {
  return confirmarComFalta ? { params: { confirmarComFalta: true } } : undefined
}

export function cadastrarItem(item, confirmarComFalta = false) {
  return api.post('/itens-pedido', item, opcoes(confirmarComFalta)).then((resposta) => resposta.data)
}

export function atualizarItem(id, item, confirmarComFalta = false) {
  return api.put(`/itens-pedido/${id}`, item, opcoes(confirmarComFalta)).then((resposta) => resposta.data)
}

export function removerItem(id) {
  return api.delete(`/itens-pedido/${id}`)
}
