const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const UNIDADES = { KG: 'kg', G: 'g', L: 'L', ML: 'ml', UNIDADE: 'un.' }

// Intl separates the symbol with a no-break space; a plain space keeps copied text and tests simple.
export function dinheiro(valor) {
  return MOEDA.format(Number(valor ?? 0)).replace(/ /g, ' ')
}

export function numero(valor, casas = 3) {
  return Number(valor ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

export function quantidade(valor, unidade) {
  return `${numero(valor)} ${UNIDADES[unidade] ?? unidade ?? ''}`.trim()
}

export function plural(total, singular, varios) {
  return `${numero(total, 0)} ${Number(total) === 1 ? singular : varios}`
}

export function codigoPedido(idPedido) {
  return `#${String(idPedido).padStart(4, '0')}`
}

export function dataPorExtenso(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
