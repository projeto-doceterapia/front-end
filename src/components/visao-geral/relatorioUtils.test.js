import { describe, expect, it } from 'vitest'
import {
  contarPedidos,
  formatarDataBr,
  formatarDinheiro,
  linhasDePedidos,
  mensagemErroRelatorio,
  percentualDaBarra,
  topCinco,
} from './relatorioUtils'

describe('relatorioUtils', () => {
  it('formata dinheiro em reais', () => {
    expect(formatarDinheiro(2500)).toBe('R$ 2.500,00')
    expect(formatarDinheiro(177.78)).toBe('R$ 177,78')
    expect(formatarDinheiro(undefined)).toBe('R$ 0,00')
  })

  it('formata a data sem deslocar o dia', () => {
    expect(formatarDataBr('2026-11-01')).toBe('01/11/2026')
  })

  it('conta status ausente como zero e deixa os cancelados de fora', () => {
    const linhas = linhasDePedidos({ ENTREGUE: 16, CANCELADO: 1 })

    expect(linhas.map((linha) => linha.rotulo)).toEqual([
      'Orçamento', 'Aguardando sinal', 'Aguardando produção', 'Em produção', 'Aguardando entrega', 'Entregue',
    ])
    expect(linhas.find((linha) => linha.status === 'AGUARDANDO_SINAL').quantidade).toBe(0)
    expect(contarPedidos({ ORCAMENTO: 3, AGUARDANDO_SINAL: 2, ENTREGUE: 16, CANCELADO: 1 })).toBe(21)
    expect(contarPedidos(undefined)).toBe(0)
  })

  it('topCinco corta em cinco na ordem recebida', () => {
    const lista = [1, 2, 3, 4, 5, 6, 7].map((numero) => ({ nome: `P${numero}` }))

    expect(topCinco(lista).map((item) => item.nome)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5'])
    expect(topCinco(undefined)).toEqual([])
  })

  it('calcula a largura da barra sem passar de 100%', () => {
    expect(percentualDaBarra(20, 40)).toBe(50)
    expect(percentualDaBarra(0, 0)).toBe(0)
  })

  it('escolhe a mensagem de erro pelo status', () => {
    expect(mensagemErroRelatorio({ response: { status: 400, data: { message: 'O período máximo por consulta é de 366 dias.' } } }))
      .toBe('O período máximo por consulta é de 366 dias.')
    expect(mensagemErroRelatorio({ response: { status: 403, data: {} } })).toBe('Seu perfil não pode gerar o relatório.')
    expect(mensagemErroRelatorio({ response: { status: 500, data: {} } })).toBe('Não foi possível carregar o relatório.')
    expect(mensagemErroRelatorio(new Error('rede'))).toBe('Não foi possível carregar o relatório. Tente novamente.')
  })
})
