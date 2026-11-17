import { diasEntre, formatarData, MAXIMO_DIAS, paraData } from '../visao-geral/periodoUtils'

export const PERIODO_MAXIMO_DIAS = MAXIMO_DIAS
// Keeps a batch URL well below the 8 KB request line limit; the API accepts up to 500 ids.
export const TAMANHO_LOTE_IDS = 200
export const STATUS_AGENDA = ['ORCAMENTO', 'AGUARDANDO_SINAL', 'ESPERANDO_FAZER', 'EM_PRODUCAO', 'AGUARDANDO_ENTREGA', 'ENTREGUE']
export const STATUS_PRODUCAO = ['AGUARDANDO_SINAL', 'ESPERANDO_FAZER', 'EM_PRODUCAO', 'AGUARDANDO_ENTREGA']

export const dataISO = formatarData
export { diasEntre }

export function somarDias(dataIso, dias) {
  const data = paraData(dataIso)
  return formatarData(new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias))
}

export function filtroAberturaAgenda(hoje = new Date()) {
  const de = dataISO(hoje)
  return { de, ate: somarDias(de, 7), status: STATUS_AGENDA }
}

export function filtroAberturaProducao(hoje = new Date()) {
  const base = dataISO(hoje)
  return { de: somarDias(base, -30), ate: somarDias(base, 7), status: STATUS_PRODUCAO }
}

export function filtroAberturaHistorico(hoje = new Date()) {
  const ate = dataISO(hoje)
  return { de: somarDias(ate, -90), ate, status: [] }
}

export function filtroDoMes(mes, status) {
  return {
    de: formatarData(new Date(mes.getFullYear(), mes.getMonth(), 1)),
    ate: formatarData(new Date(mes.getFullYear(), mes.getMonth() + 1, 0)),
    status,
  }
}

export function periodoCobreMes({ de, ate }, mes) {
  const doMes = filtroDoMes(mes, [])
  return de <= doMes.de && ate >= doMes.ate
}

export function validarFiltro({ de, ate, status }, { exigeStatus = false } = {}) {
  if (!de || !ate) return 'Informe as duas datas do período.'
  if (diasEntre(de, ate) < 0) return 'A data inicial deve ser igual ou anterior à data final.'
  if (diasEntre(de, ate) > PERIODO_MAXIMO_DIAS) return `O período pode ter no máximo ${PERIODO_MAXIMO_DIAS} dias.`
  if (exigeStatus && !status?.length) return 'Selecione ao menos uma etapa.'
  return null
}

export function dividirEmLotes(lista, tamanho = TAMANHO_LOTE_IDS) {
  const lotes = []
  for (let inicio = 0; inicio < lista.length; inicio += tamanho) lotes.push(lista.slice(inicio, inicio + tamanho))
  return lotes
}

export function formatarDataCompleta(dataIso) {
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function mensagemErroCarga(erro) {
  return erro?.response?.data?.message || 'Não foi possível carregar os pedidos. Verifique a conexão com o servidor.'
}
