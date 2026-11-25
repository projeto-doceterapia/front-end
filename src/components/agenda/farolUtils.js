import { plural } from '../formatos'

export const NIVEIS_FAROL = {
  livre: { rotulo: 'Livre', classe: 'free' },
  quase: { rotulo: 'Quase cheio', classe: 'warning' },
  lotado: { rotulo: 'Lotado', classe: 'full' },
}

export function farolConfigurado(farol) {
  return Boolean(farol?.limiteAmarelo && farol?.limiteVermelho)
}

// One rule feeds the day color, the day label and the legend so they never disagree.
export function nivelFarol(quantidade, farol) {
  if (!farolConfigurado(farol) || !quantidade) return null
  if (quantidade >= farol.limiteVermelho) return 'lotado'
  if (quantidade >= farol.limiteAmarelo) return 'quase'
  return 'livre'
}

function faixa(minimo, maximo) {
  if (minimo === maximo) return plural(minimo, 'pedido', 'pedidos')
  return `${minimo} a ${plural(maximo, 'pedido', 'pedidos')}`
}

export function faixasFarol(farol) {
  if (!farolConfigurado(farol)) return []
  const amarelo = Number(farol.limiteAmarelo)
  const vermelho = Number(farol.limiteVermelho)
  return [
    amarelo > 1 && { nivel: 'livre', texto: faixa(1, amarelo - 1) },
    vermelho > amarelo && { nivel: 'quase', texto: faixa(amarelo, vermelho - 1) },
    { nivel: 'lotado', texto: `${vermelho} ou mais` },
  ].filter(Boolean)
}
