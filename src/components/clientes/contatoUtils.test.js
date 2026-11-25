import { describe, it, expect } from 'vitest'
import { linkTelefone, linkWhatsApp } from './contatoUtils'

describe('contatoUtils', () => {
  it('monta os links a partir do telefone com o código do país', () => {
    expect(linkTelefone('+55 11 90000-0001')).toBe('tel:+5511900000001')
    expect(linkWhatsApp('+55 11 90000-0001')).toBe('https://wa.me/5511900000001')
  })

  it('acrescenta o código do Brasil quando falta', () => {
    expect(linkWhatsApp('(11) 90000-0002')).toBe('https://wa.me/5511900000002')
  })

  it('não monta link sem telefone', () => {
    expect(linkTelefone('')).toBeNull()
    expect(linkWhatsApp(null)).toBeNull()
  })
})
