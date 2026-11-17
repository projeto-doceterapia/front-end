import { describe, expect, it, vi } from 'vitest'
import { montarOperacoes, podeEditarItens } from './itensEdicao'

vi.mock('../../services/api', () => ({ default: {} }))

describe('itensEdicao', () => {
  it('libera itens só antes da produção e sem pagamento integral', () => {
    expect(podeEditarItens('ORCAMENTO')).toBe(true)
    expect(podeEditarItens('AGUARDANDO_SINAL', { statusPagamento: 'SINAL_PAGO' })).toBe(true)
    expect(podeEditarItens('ESPERANDO_FAZER', { statusPagamento: 'PAGO_INTEGRAL' })).toBe(false)
    expect(podeEditarItens('EM_PRODUCAO')).toBe(false)
    expect(podeEditarItens('ENTREGUE')).toBe(false)
  })

  it('monta remoções, alterações e inclusões nessa ordem, sem item inalterado', () => {
    const originais = [
      { idProdutoPedido: 1, fkProduto: 9, quantidade: 1 },
      { idProdutoPedido: 2, fkProduto: 10, quantidade: 2 },
      { idProdutoPedido: 3, fkProduto: 11, quantidade: 1 },
    ]
    const linhas = [
      { idProdutoPedido: 1, fkProduto: 9, quantidade: '1' },
      { idProdutoPedido: 3, fkProduto: 11, quantidade: '4' },
      { fkProduto: 12, quantidade: '1' },
    ]
    const operacoes = montarOperacoes(originais, linhas, 42, (id) => `Produto ${id}`)
    expect(operacoes.map((operacao) => [operacao.descricao, operacao.verifica])).toEqual([
      ['Produto 10', false],
      ['Produto 11', true],
      ['Produto 12', true],
    ])
  })
})
