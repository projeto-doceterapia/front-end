import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listarNaoLidas, marcarComoLida, assinarStream } from './notificacoes'
import api from './api'

vi.mock('./api', () => ({
  default: {
    defaults: { baseURL: 'http://localhost:8080' },
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

class FakeEventSource {
  static last = null
  constructor(url, options) {
    this.url = url
    this.options = options
    this.listeners = {}
    this.closed = false
    FakeEventSource.last = this
  }
  addEventListener(tipo, callback) {
    this.listeners[tipo] = this.listeners[tipo] || []
    this.listeners[tipo].push(callback)
  }
  emitir(tipo, data) {
    const evento = data === undefined ? {} : { data: JSON.stringify(data) }
    ;(this.listeners[tipo] || []).forEach((callback) => callback(evento))
  }
  emitirBruto(tipo, data) {
    ;(this.listeners[tipo] || []).forEach((callback) => callback({ data }))
  }
  close() {
    this.closed = true
  }
}

describe('serviço de notificações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('lista não lidas pelo axios', async () => {
    api.get.mockResolvedValueOnce({ data: [{ idNotificacao: 1 }] })
    const lista = await listarNaoLidas()
    expect(api.get).toHaveBeenCalledWith('/notificacoes/nao-lidas')
    expect(lista).toEqual([{ idNotificacao: 1 }])
  })

  it('marca como lida pelo axios', async () => {
    api.patch.mockResolvedValueOnce({ data: { idNotificacao: 5, lida: true } })
    await marcarComoLida(5)
    expect(api.patch).toHaveBeenCalledWith('/notificacoes/5/marcar-lida')
  })

  it('abre o EventSource na mesma base da api com credenciais', () => {
    assinarStream({})
    expect(FakeEventSource.last.url).toBe('http://localhost:8080/notificacoes/stream')
    expect(FakeEventSource.last.options).toEqual({ withCredentials: true })
  })

  it('encaminha eventos notificacao e lida e fecha ao encerrar', () => {
    const aoNotificar = vi.fn()
    const aoMarcarLida = vi.fn()
    const encerrar = assinarStream({ aoNotificar, aoMarcarLida })

    FakeEventSource.last.emitir('notificacao', { idNotificacao: 9 })
    FakeEventSource.last.emitir('lida', { id: 9 })
    expect(aoNotificar).toHaveBeenCalledWith({ idNotificacao: 9 })
    expect(aoMarcarLida).toHaveBeenCalledWith(9)

    encerrar()
    expect(FakeEventSource.last.closed).toBe(true)
  })

  it('ignora um evento malformado sem recarregar nem lançar', () => {
    const aoNotificar = vi.fn()
    const aoMarcarLida = vi.fn()
    const aoReconectar = vi.fn()
    assinarStream({ aoNotificar, aoMarcarLida, aoReconectar })

    expect(() => FakeEventSource.last.emitirBruto('notificacao', '{bad json')).not.toThrow()
    expect(() => FakeEventSource.last.emitirBruto('lida', '{bad json')).not.toThrow()

    expect(aoNotificar).not.toHaveBeenCalled()
    expect(aoMarcarLida).not.toHaveBeenCalled()
    expect(aoReconectar).not.toHaveBeenCalled()
  })
})
