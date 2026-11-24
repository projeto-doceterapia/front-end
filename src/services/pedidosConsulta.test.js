import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import api from './api'
import { carregarPedidosComRelacionamentos, listarPedidos } from './pedidosConsulta'

vi.mock('./api', () => ({ default: { get: vi.fn() } }))

function responderPedidos(pedidos) {
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/pedidos' ? pedidos : [{ url }] }))
}

function chamadas(url) {
  return api.get.mock.calls.filter(([chamada]) => chamada === url)
}

describe('pedidosConsulta', () => {
  afterEach(() => vi.clearAllMocks())

  it('envia período e etapas separadas por vírgula', async () => {
    responderPedidos([])
    await listarPedidos({ de: '2026-10-17', ate: '2026-11-23', status: ['EM_PRODUCAO', 'AGUARDANDO_ENTREGA'] })
    const [, config] = chamadas('/pedidos')[0]
    expect(config.params).toEqual({ de: '2026-10-17', ate: '2026-11-23', status: 'EM_PRODUCAO,AGUARDANDO_ENTREGA' })
    expect(axios.getUri({ url: '/pedidos', params: config.params })).toBe('/pedidos?de=2026-10-17&ate=2026-11-23&status=EM_PRODUCAO,AGUARDANDO_ENTREGA')
  })

  it('omite status quando todas as etapas', async () => {
    responderPedidos([])
    await listarPedidos({ de: '2026-08-18', ate: '2026-11-16', status: [] })
    expect(chamadas('/pedidos')[0][1].params).toEqual({ de: '2026-08-18', ate: '2026-11-16' })
  })

  it('busca itens e pagamentos só dos pedidos do recorte', async () => {
    responderPedidos([{ idPedido: 41 }, { idPedido: 42 }, { idPedido: 57 }])
    const recorte = await carregarPedidosComRelacionamentos({ de: '2026-11-16', ate: '2026-11-23', status: [] })
    expect(chamadas('/itens-pedido').map(([, config]) => config.params)).toEqual([{ pedidoId: '41,42,57' }])
    expect(chamadas('/pagamentos').map(([, config]) => config.params)).toEqual([{ pedidoId: '41,42,57' }])
    expect(recorte.itens).toEqual([{ url: '/itens-pedido' }])
    expect(recorte.pagamentos).toEqual([{ url: '/pagamentos' }])
  })

  it('divide os ids em lotes', async () => {
    responderPedidos(Array.from({ length: 401 }, (_, indice) => ({ idPedido: indice + 1 })))
    await carregarPedidosComRelacionamentos({ de: '2026-11-16', ate: '2026-11-23', status: [] })
    const tamanhos = (url) => chamadas(url).map(([, config]) => config.params.pedidoId.split(',').length)
    expect(tamanhos('/itens-pedido')).toEqual([200, 200, 1])
    expect(tamanhos('/pagamentos')).toEqual([200, 200, 1])
  })

  it('recorte vazio não chama itens nem pagamentos', async () => {
    responderPedidos([])
    const recorte = await carregarPedidosComRelacionamentos({ de: '2026-11-16', ate: '2026-11-23', status: [] })
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(recorte).toEqual({ pedidos: [], itens: [], pagamentos: [] })
  })

  it('repassa o signal de cancelamento', async () => {
    responderPedidos([{ idPedido: 1 }])
    const controle = new AbortController()
    await carregarPedidosComRelacionamentos({ de: '2026-11-16', ate: '2026-11-23', status: [] }, { signal: controle.signal })
    expect(api.get.mock.calls.every(([, config]) => config.signal === controle.signal)).toBe(true)
  })
})
