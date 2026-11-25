import { describe, it, expect } from 'vitest'
import { faltaParaMinimo, nivelEstoque, sentidoMovimento } from './estoqueUtils'

describe('estoqueUtils', () => {
  it('classifica crítico até metade do mínimo e baixo abaixo do mínimo', () => {
    expect(nivelEstoque({ quantidadeAtual: 1.5, quantidadeMinima: 3 }).status).toBe('critico')
    expect(nivelEstoque({ quantidadeAtual: 2.5, quantidadeMinima: 3.5 }).status).toBe('baixo')
    expect(nivelEstoque({ quantidadeAtual: 5, quantidadeMinima: 5 }).status).toBe('normal')
  })

  it('calcula quanto falta para o mínimo', () => {
    expect(faltaParaMinimo({ quantidadeAtual: 1.2, quantidadeMinima: 3 })).toBeCloseTo(1.8)
    expect(faltaParaMinimo({ quantidadeAtual: 8, quantidadeMinima: 3 })).toBe(0)
  })

  it('indica entrada e saída pelo sinal da quantidade', () => {
    expect(sentidoMovimento(10)).toEqual({ seta: '↑', rotulo: 'Entrada', sinal: '+' })
    expect(sentidoMovimento(-0.6)).toEqual({ seta: '↓', rotulo: 'Saída', sinal: '−' })
  })
})
