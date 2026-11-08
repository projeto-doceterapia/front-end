import { describe, expect, it } from 'vitest'
import { formatarCep, montarEndereco, somenteDigitos } from './enderecoUtils'

describe('enderecoUtils', () => {
  it('extrai só os dígitos', () => {
    expect(somenteDigitos('01001-000')).toBe('01001000')
    expect(somenteDigitos(undefined)).toBe('')
  })

  it('aplica a máscara do CEP, inclusive parcial', () => {
    expect(formatarCep('01001000')).toBe('01001-000')
    expect(formatarCep('0100')).toBe('0100')
    expect(formatarCep('010010001234')).toBe('01001-000')
  })

  it('monta o endereço sem partes vazias', () => {
    expect(
      montarEndereco({ rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' })
    ).toBe('Praça da Sé, Sé, São Paulo - SP')
    expect(montarEndereco({ rua: '', bairro: '', cidade: 'São Paulo', uf: 'SP' })).toBe(
      'São Paulo - SP'
    )
    expect(montarEndereco({ rua: 'Rua Exemplo', bairro: '', cidade: '', uf: '' })).toBe(
      'Rua Exemplo'
    )
  })
})
