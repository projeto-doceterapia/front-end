import { describe, it, expect } from 'vitest'
import { codigoPedido, dataPorExtenso, dinheiro, numero, plural, quantidade } from './formatos'

describe('formatos', () => {
  it('formata dinheiro em reais', () => {
    expect(dinheiro(1845)).toBe('R$ 1.845,00')
    expect(dinheiro(null)).toBe('R$ 0,00')
  })

  it('usa vírgula decimal nos números e quantidades', () => {
    expect(numero(1.2)).toBe('1,2')
    expect(quantidade(1.2, 'KG')).toBe('1,2 kg')
    expect(quantidade(30, 'UNIDADE')).toBe('30 un.')
  })

  it('escolhe singular ou plural', () => {
    expect(plural(1, 'pedido', 'pedidos')).toBe('1 pedido')
    expect(plural(0, 'pedido', 'pedidos')).toBe('0 pedidos')
    expect(plural(3, 'pedido', 'pedidos')).toBe('3 pedidos')
  })

  it('mostra o código do pedido com quatro dígitos', () => {
    expect(codigoPedido(101)).toBe('#0101')
  })

  it('escreve a data por extenso', () => {
    expect(dataPorExtenso('2026-11-29')).toBe('domingo, 29 de novembro de 2026')
    expect(dataPorExtenso('')).toBe('')
  })
})
