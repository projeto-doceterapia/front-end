import { describe, it, expect } from 'vitest'
import { situacaoPagamento } from './pedidoUtils'

describe('situacaoPagamento', () => {
  it('separa pagamento completo, parcial e nenhum', () => {
    expect(situacaoPagamento(80, 80)).toBe('completo')
    expect(situacaoPagamento(40, 80)).toBe('parcial')
    expect(situacaoPagamento(0, 80)).toBe('nenhum')
    expect(situacaoPagamento(0, 0)).toBe('nenhum')
  })
})
