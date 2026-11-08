export const MAXIMO_DIAS = 366

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Dates are built from local components: toISOString would shift the day after 21h in Brazil.
export function formatarData(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function paraData(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function mesAtual(hoje) {
  return ultimosMeses(hoje, 1)
}

export function mesPassado(hoje) {
  return {
    de: formatarData(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
    ate: formatarData(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
  }
}

// From the first day of the first month to the last day of the current month.
export function ultimosMeses(hoje, quantidade) {
  return {
    de: formatarData(new Date(hoje.getFullYear(), hoje.getMonth() - quantidade + 1, 1)),
    ate: formatarData(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  }
}

export function ultimosDias(hoje, dias) {
  return {
    de: formatarData(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dias)),
    ate: formatarData(hoje),
  }
}

export function diasEntre(de, ate) {
  const inicio = paraData(de)
  const fim = paraData(ate)
  return Math.round((Date.UTC(fim.getFullYear(), fim.getMonth(), fim.getDate())
    - Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())) / MS_POR_DIA)
}

export function validarPeriodo(de, ate) {
  if (!de || !ate) return 'Informe a data inicial e a data final.'
  if (diasEntre(de, ate) < 0) return 'A data inicial deve ser anterior ou igual à data final.'
  if (diasEntre(de, ate) > MAXIMO_DIAS) return 'O período máximo é de 366 dias. Escolha um intervalo menor.'
  return null
}
