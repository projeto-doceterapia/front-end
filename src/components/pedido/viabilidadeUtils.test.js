import { describe, expect, it } from 'vitest'
import { contarSemFichaTecnica, extrairFaltas, formatarQuantidade, quantidadeFaltante, textoSemFichaTecnica } from './viabilidadeUtils'

const FALTA = { insumoId: 7, nome: 'Chocolate meio amargo', necessario: 1.2, disponivel: 0.8, unidade: 'KG' }

describe('viabilidadeUtils', () => {
  it('formata quantidade e unidade', () => {
    expect(formatarQuantidade(1.2, 'KG')).toBe('1,2 kg')
    expect(formatarQuantidade(6, 'UNIDADE')).toBe('6 un.')
    expect(formatarQuantidade(0.1234, 'L')).toBe('0,123 L')
    expect(formatarQuantidade(2, 'CAIXA')).toBe('2 CAIXA')
  })

  it('calcula quanto falta com 3 casas', () => {
    expect(quantidadeFaltante(FALTA)).toBe(0.4)
    expect(quantidadeFaltante({ necessario: 3, disponivel: -1 })).toBe(4)
  })

  it('extrai faltas só de 422 com lista preenchida', () => {
    expect(extrairFaltas({ response: { status: 422, data: { faltas: [FALTA] } } })).toEqual([FALTA])
    expect(extrairFaltas({ response: { status: 422, data: { faltas: [] } } })).toBeNull()
    expect(extrairFaltas({ response: { status: 422, data: { message: 'Regra' } } })).toBeNull()
    expect(extrairFaltas({ response: { status: 500, data: { faltas: [FALTA] } } })).toBeNull()
    expect(extrairFaltas(new Error('rede'))).toBeNull()
  })

  it('conta e descreve itens sem ficha técnica', () => {
    expect(contarSemFichaTecnica([{ semFichaTecnica: true }, { semFichaTecnica: false }, {}])).toBe(1)
    expect(textoSemFichaTecnica(1)).toBe('1 item sem ficha técnica: estoque não verificado.')
    expect(textoSemFichaTecnica(2)).toBe('2 itens sem ficha técnica: estoque não verificado.')
  })
})
