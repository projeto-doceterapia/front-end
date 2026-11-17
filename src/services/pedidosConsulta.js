import api from './api'
import { dividirEmLotes } from '../components/pedidos/filtrosUtils'

// Repeated filters travel comma-separated (status=A,B); axios would otherwise send status[]=A.
function emLista(valores) {
  return valores.join(',')
}

export function listarPedidos({ de, ate, status }, config = {}) {
  const params = status?.length ? { de, ate, status: emLista(status) } : { de, ate }
  return api.get('/pedidos', { ...config, params }).then((resposta) => resposta.data || [])
}

async function listarPorPedidos(url, ids, config) {
  if (!ids.length) return []
  const respostas = await Promise.all(dividirEmLotes(ids).map((lote) => api.get(url, { ...config, params: { pedidoId: emLista(lote) } })))
  return respostas.flatMap((resposta) => resposta.data || [])
}

export function listarItensDosPedidos(ids, config = {}) {
  return listarPorPedidos('/itens-pedido', ids, config)
}

export function listarPagamentosDosPedidos(ids, config = {}) {
  return listarPorPedidos('/pagamentos', ids, config)
}

export async function carregarPedidosComRelacionamentos(filtro, config = {}) {
  const pedidos = await listarPedidos(filtro, config)
  const ids = pedidos.map((pedido) => pedido.idPedido)
  const [itens, pagamentos] = await Promise.all([listarItensDosPedidos(ids, config), listarPagamentosDosPedidos(ids, config)])
  return { pedidos, itens, pagamentos }
}
