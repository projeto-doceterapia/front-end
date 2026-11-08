import api from './api'

export async function buscarOperacionais({ de, ate }) {
  const { data } = await api.get('/indicadores/operacionais', { params: { de, ate } })
  return data
}

export async function buscarFinanceiros({ de, ate }) {
  const { data } = await api.get('/indicadores/financeiros', { params: { de, ate } })
  return data
}
