import { describe, it, expect } from 'vitest'
import { faixasFarol, farolConfigurado, nivelFarol } from './farolUtils'

const FAROL = { limiteAmarelo: 3, limiteVermelho: 5 }

describe('farolUtils', () => {
  it('reconhece só farol com limites', () => {
    expect(farolConfigurado(null)).toBe(false)
    expect(farolConfigurado({})).toBe(false)
    expect(farolConfigurado(FAROL)).toBe(true)
  })

  it('classifica a quantidade de pedidos do dia', () => {
    expect(nivelFarol(0, FAROL)).toBeNull()
    expect(nivelFarol(2, FAROL)).toBe('livre')
    expect(nivelFarol(3, FAROL)).toBe('quase')
    expect(nivelFarol(5, FAROL)).toBe('lotado')
    expect(nivelFarol(2, null)).toBeNull()
  })

  it('descreve as faixas da legenda com a mesma regra', () => {
    expect(faixasFarol(FAROL)).toEqual([
      { nivel: 'livre', texto: '1 a 2 pedidos' },
      { nivel: 'quase', texto: '3 a 4 pedidos' },
      { nivel: 'lotado', texto: '5 ou mais' },
    ])
  })
})
