import { describe, it, expect } from 'vitest'
import { dataCurta, dataLonga } from './dataTopbar'

const DATA = new Date(2026, 10, 24)

describe('datas da barra superior', () => {
  it('formata a data curta sem a preposição', () => {
    expect(dataCurta(DATA)).toBe('ter., 24 nov.')
  })

  it('formata a data longa por extenso', () => {
    expect(dataLonga(DATA)).toBe('terça-feira, 24 de novembro')
  })
})
