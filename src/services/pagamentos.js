import api from './api'

function corpoRegistro({ formaPagamento, dataPagamento }) {
  return dataPagamento ? { formaPagamento, dataPagamento } : { formaPagamento }
}

export function buscarPagamentoDoPedido(pedidoId) {
  return api.get(`/pagamentos/pedido/${pedidoId}`).then((resposta) => resposta.data)
}

export function registrarSinal(idPagamento, registro) {
  return api.patch(`/pagamentos/${idPagamento}/registrar-sinal`, corpoRegistro(registro)).then((resposta) => resposta.data)
}

export function registrarRestante(idPagamento, registro) {
  return api.patch(`/pagamentos/${idPagamento}/registrar-restante`, corpoRegistro(registro)).then((resposta) => resposta.data)
}
