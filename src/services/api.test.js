import { afterEach, describe, expect, it, vi } from 'vitest'
import api, { definirAoExpirarSessao } from './api'
import instalarApiFalsa, { FALHA_DE_REDE } from '../test/apiFalsa'

describe('api - resposta 401', () => {
  let removerCallback = () => {}

  afterEach(() => {
    removerCallback()
  })

  function observarExpiracao() {
    const aoExpirar = vi.fn()
    removerCallback = definirAoExpirarSessao(aoExpirar)
    return aoExpirar
  }

  it.each([
    ['post', '/usuarios/login'],
    ['get', '/usuarios/me'],
    ['post', '/usuarios/logout'],
  ])('ignora 401 das rotas de sessão: %s %s', async (metodo, url) => {
    instalarApiFalsa({ [`${metodo.toUpperCase()} ${url}`]: { status: 401 } })
    const aoExpirar = observarExpiracao()

    await expect(api[metodo](url)).rejects.toMatchObject({ response: { status: 401 } })

    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('avisa a expiração em 401 de outra rota e rejeita para quem chamou', async () => {
    instalarApiFalsa({ 'GET /insumos': { status: 401 } })
    const aoExpirar = observarExpiracao()

    await expect(api.get('/insumos')).rejects.toMatchObject({ response: { status: 401 } })

    expect(aoExpirar).toHaveBeenCalledTimes(1)
  })

  it('não avisa a expiração em outros erros', async () => {
    instalarApiFalsa({ 'GET /insumos': { status: 500 }, 'GET /clientes': FALHA_DE_REDE })
    const aoExpirar = observarExpiracao()

    await expect(api.get('/insumos')).rejects.toBeDefined()
    await expect(api.get('/clientes')).rejects.toBeDefined()

    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('para de avisar depois de removido', async () => {
    instalarApiFalsa({ 'GET /insumos': { status: 401 } })
    const aoExpirar = observarExpiracao()

    removerCallback()
    await expect(api.get('/insumos')).rejects.toBeDefined()

    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('a remoção de um callback antigo não apaga o atual', async () => {
    instalarApiFalsa({ 'GET /insumos': { status: 401 } })
    const removerAntigo = definirAoExpirarSessao(vi.fn())
    const aoExpirar = observarExpiracao()

    removerAntigo()
    await expect(api.get('/insumos')).rejects.toBeDefined()

    expect(aoExpirar).toHaveBeenCalledTimes(1)
  })
})
