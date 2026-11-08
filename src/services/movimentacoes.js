import api from './api'

export async function buscarMovimentacoes({ de, ate, insumoId }) {
  const params = insumoId ? { de, ate, insumoId } : { de, ate }
  const { data } = await api.get('/estoque/movimentos', { params })
  return data
}
