import { describe, it, expect } from 'vitest'
import { destaquePrazo } from './producaoUtils'

describe('destaquePrazo', () => {
  it('pede a ação certa para cada fase no dia da entrega', () => {
    expect(destaquePrazo('ESPERANDO_FAZER', 0)).toBe('Começar hoje')
    expect(destaquePrazo('EM_PRODUCAO', 0)).toBe('Finalizar hoje')
    expect(destaquePrazo('AGUARDANDO_ENTREGA', 0)).toBe('Entregar hoje')
  })

  it('não destaca pedidos sem sinal nem outros dias', () => {
    expect(destaquePrazo('AGUARDANDO_SINAL', 0)).toBeNull()
    expect(destaquePrazo('ESPERANDO_FAZER', 2)).toBeNull()
  })
})
