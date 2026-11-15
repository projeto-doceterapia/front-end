import api from './api'

const TAMANHO_LOTE = 200

function dataISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export async function carregarPedidosComRelacionamentos(params) {
  const { data: pedidos = [] } = await api.get('/pedidos', { params })
  const lotes = []
  for (let inicio = 0; inicio < pedidos.length; inicio += TAMANHO_LOTE) {
    lotes.push(pedidos.slice(inicio, inicio + TAMANHO_LOTE).map((pedido) => pedido.idPedido).join(','))
  }
  const relacionados = await Promise.all(lotes.map(async (pedidoId) => {
    const [itens, pagamentos] = await Promise.all([
      api.get('/itens-pedido', { params: { pedidoId } }),
      api.get('/pagamentos', { params: { pedidoId } }),
    ])
    return { itens: itens.data || [], pagamentos: pagamentos.data || [] }
  }))
  return {
    pedidos,
    itens: relacionados.flatMap((resultado) => resultado.itens),
    pagamentos: relacionados.flatMap((resultado) => resultado.pagamentos),
  }
}

export function intervaloDoMes(data) {
  const inicio = new Date(data.getFullYear(), data.getMonth(), 1)
  const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0)
  return { de: dataISO(inicio), ate: dataISO(fim) }
}

export function intervaloRelativo(diasAntes, diasDepois) {
  const hoje = new Date()
  const de = new Date(hoje)
  const ate = new Date(hoje)
  de.setDate(de.getDate() - diasAntes)
  ate.setDate(ate.getDate() + diasDepois)
  return { de: dataISO(de), ate: dataISO(ate) }
}
