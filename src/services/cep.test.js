import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, create, apiImportada } = vi.hoisted(() => {
  const get = vi.fn()
  return { get, create: vi.fn(() => ({ get })), apiImportada: vi.fn() }
})

vi.mock('axios', () => ({ default: { create } }))
vi.mock('./api', () => {
  apiImportada()
  return { default: {} }
})

import { buscarEndereco, ERRO_CEP } from './cep'

const configDaInstancia = create.mock.calls[0][0]

async function codigoDoErro(promessa) {
  try {
    await promessa
  } catch (erro) {
    return erro.codigo
  }
  return undefined
}

describe('buscarEndereco', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('usa instância própria sem credenciais', () => {
    expect(configDaInstancia.withCredentials).toBe(false)
    expect(configDaInstancia.baseURL).toBe('https://brasilapi.com.br/api/cep/v2')
    expect(apiImportada).not.toHaveBeenCalled()
  })

  it('mapeia a resposta v2', async () => {
    get.mockResolvedValue({
      data: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP', service: 'open-cep' },
    })

    const endereco = await buscarEndereco('01001-000')

    expect(get).toHaveBeenCalledWith('/01001000')
    expect(endereco).toEqual({ rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' })
  })

  it('devolve texto vazio nas partes ausentes de um CEP geral', async () => {
    get.mockResolvedValue({ data: { city: 'Cidade Exemplo', state: 'SP' } })

    expect(await buscarEndereco('12345000')).toEqual({
      rua: '',
      bairro: '',
      cidade: 'Cidade Exemplo',
      uf: 'SP',
    })
  })

  it('classifica os erros', async () => {
    get.mockRejectedValueOnce({ response: { status: 404 } })
    expect(await codigoDoErro(buscarEndereco('99999999'))).toBe(ERRO_CEP.NAO_ENCONTRADO)

    get.mockRejectedValueOnce({ response: { status: 400 } })
    expect(await codigoDoErro(buscarEndereco('99999999'))).toBe(ERRO_CEP.NAO_ENCONTRADO)

    get.mockRejectedValueOnce({ response: { status: 503 } })
    expect(await codigoDoErro(buscarEndereco('01001000'))).toBe(ERRO_CEP.INDISPONIVEL)

    get.mockRejectedValueOnce({ response: { status: 429 } })
    expect(await codigoDoErro(buscarEndereco('01001000'))).toBe(ERRO_CEP.INDISPONIVEL)

    get.mockRejectedValueOnce(new Error('Network Error'))
    expect(await codigoDoErro(buscarEndereco('01001000'))).toBe(ERRO_CEP.INDISPONIVEL)

    get.mockClear()
    expect(await codigoDoErro(buscarEndereco('0100'))).toBe(ERRO_CEP.INVALIDO)
    expect(get).not.toHaveBeenCalled()
  })
})
