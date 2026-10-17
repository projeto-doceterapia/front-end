import { describe, it, expect } from 'vitest'

describe('ambiente de testes', () => {
  it('executa o Vitest com jsdom', () => {
    expect(typeof window).toBe('object')
    expect(document.body).toBeInTheDocument()
  })
})
