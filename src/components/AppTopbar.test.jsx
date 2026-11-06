import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import AppTopbar from './AppTopbar'
import api from '../services/api'
import useSessao from './sessao/useSessao'
import renderComToast from '../test/renderComToast'

vi.mock('../services/api', () => ({
  default: {
    defaults: { baseURL: 'http://localhost:8080' },
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('./sessao/useSessao', () => ({ default: vi.fn() }))

const DONA = { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com' }
const FUNCIONARIA = { id: 2, nome: 'Funcionária Exemplo', email: 'funcionaria@exemplo.com', perfil: 'FUNCIONARIA' }

function simularSessao(usuario = DONA, perfil = 'DONA', sair = vi.fn()) {
  useSessao.mockReturnValue({ usuario, perfil, ehDona: perfil === 'DONA', carregando: false, sair, entrar: vi.fn() })
  return sair
}

// Minimal controllable EventSource double. Tests drive events through the
// registered listeners, so no real stream is opened.
class FakeEventSource {
  static instances = []
  constructor(url, options) {
    this.url = url
    this.options = options
    this.listeners = {}
    this.closed = false
    FakeEventSource.instances.push(this)
  }
  addEventListener(tipo, callback) {
    this.listeners[tipo] = this.listeners[tipo] || []
    this.listeners[tipo].push(callback)
  }
  emitir(tipo, data) {
    const evento = data === undefined ? {} : { data: JSON.stringify(data) }
    ;(this.listeners[tipo] || []).forEach((callback) => callback(evento))
  }
  close() {
    this.closed = true
  }
}

const ESTOQUE_BAIXO = {
  idNotificacao: 1,
  tipo: 'ESTOQUE_BAIXO',
  titulo: 'Estoque baixo de farinha',
  mensagem: 'Saldo abaixo do mínimo',
  dataCriacao: '2026-06-14T10:30:00',
  lida: false,
}

const DIA_LOTADO = {
  idNotificacao: 2,
  tipo: 'DIA_LOTADO',
  titulo: 'Dia lotado',
  mensagem: '5 pedidos para a data',
  dataCriacao: '2026-06-15T08:00:00',
  lida: false,
}

function abrirPainel() {
  fireEvent.click(screen.getByRole('button', { name: /notificaç/i }))
}

describe('AppTopbar - usuário logado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    api.get.mockResolvedValue({ data: [] })
  })

  it('mostra o usuário logado', async () => {
    simularSessao()
    render(<AppTopbar />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(screen.getByLabelText('Dona Exemplo, Dona')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText('Dona Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Dona')).toBeInTheDocument()
    expect(screen.queryByText(/Administrador/)).not.toBeInTheDocument()
    await screen.findByRole('button', { name: 'Notificações' })
  })

  it('mostra o rótulo da FUNCIONARIA', async () => {
    simularSessao(FUNCIONARIA, 'FUNCIONARIA')
    render(<AppTopbar />)

    expect(await screen.findByLabelText('Funcionária Exemplo, Funcionária')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('desabilita Sair enquanto a chamada está em andamento', async () => {
    let terminar
    const sair = simularSessao(DONA, 'DONA', vi.fn(() => new Promise((resolve) => { terminar = resolve })))
    render(<AppTopbar />)
    const botao = screen.getByRole('button', { name: 'Sair' })

    fireEvent.click(botao)
    expect(botao).toBeDisabled()
    fireEvent.click(botao)
    expect(sair).toHaveBeenCalledTimes(1)

    await act(async () => terminar())
    expect(botao).toBeEnabled()
  })
})

describe('AppTopbar - acesso por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    api.get.mockReset()
    api.get.mockResolvedValue({ data: [] })
  })

  it('mostra Usuários só para a DONA e abre o diálogo', async () => {
    simularSessao()
    renderComToast(<AppTopbar />)

    fireEvent.click(await screen.findByRole('button', { name: 'Usuários' }))

    expect(await screen.findByRole('dialog', { name: 'Usuários' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/usuarios')
  })

  it('oculta Usuários e a configuração de notificações para a FUNCIONARIA', async () => {
    simularSessao(FUNCIONARIA, 'FUNCIONARIA')
    render(<AppTopbar />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Usuários' })).not.toBeInTheDocument()
    abrirPainel()
    expect(screen.getByRole('button', { name: 'Marcar todas como lidas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Configurar notificações' })).not.toBeInTheDocument()
  })

  it('mostra a configuração de notificações para a DONA', async () => {
    simularSessao()
    render(<AppTopbar />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    abrirPainel()
    expect(screen.getByRole('button', { name: 'Configurar notificações' })).toBeInTheDocument()
  })
})

describe('AppTopbar - lista de notificações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockReset()
    simularSessao()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('mostra a contagem de não lidas vinda do back-end', async () => {
    api.get.mockResolvedValueOnce({ data: [ESTOQUE_BAIXO, DIA_LOTADO] })
    render(<AppTopbar />)

    expect(await screen.findByRole('button', { name: '2 notificações não lidas' })).toBeInTheDocument()
    abrirPainel()
    expect(screen.getByText('Estoque baixo de farinha')).toBeInTheDocument()
    expect(screen.getByText('Dia lotado')).toBeInTheDocument()
  })

  it('marca como lida no servidor e remove da lista', async () => {
    api.get.mockResolvedValueOnce({ data: [ESTOQUE_BAIXO] })
    api.patch.mockResolvedValueOnce({ data: { ...ESTOQUE_BAIXO, lida: true } })
    render(<AppTopbar />)

    await screen.findByRole('button', { name: '1 notificações não lidas' })
    abrirPainel()
    fireEvent.click(screen.getByRole('button', { name: /Marcar "Estoque baixo de farinha" como lida/ }))

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/notificacoes/1/marcar-lida'))
    expect(screen.getByText('Nenhuma notificação não lida.')).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há não lidas', async () => {
    api.get.mockResolvedValueOnce({ data: [] })
    render(<AppTopbar />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/notificacoes/nao-lidas'))
    abrirPainel()
    expect(await screen.findByText('Nenhuma notificação não lida.')).toBeInTheDocument()
  })

  it('mostra mensagem de erro em PT-BR quando a carga falha', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'))
    render(<AppTopbar />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    abrirPainel()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as notificações.')
  })
})

describe('AppTopbar - stream ao vivo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockReset()
    simularSessao()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('exibe uma nova notificação sem remontar o componente', async () => {
    api.get.mockResolvedValueOnce({ data: [] })
    render(<AppTopbar />)

    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(0))
    const fonte = FakeEventSource.instances[0]
    act(() => fonte.emitir('notificacao', DIA_LOTADO))

    expect(await screen.findByRole('button', { name: '1 notificações não lidas' })).toBeInTheDocument()
    abrirPainel()
    expect(screen.getByText('Dia lotado')).toBeInTheDocument()
  })

  it('atualiza a contagem quando chega um evento de leitura', async () => {
    api.get.mockResolvedValueOnce({ data: [ESTOQUE_BAIXO, DIA_LOTADO] })
    render(<AppTopbar />)

    await screen.findByRole('button', { name: '2 notificações não lidas' })
    const fonte = FakeEventSource.instances[0]
    act(() => fonte.emitir('lida', { id: 1 }))

    expect(await screen.findByRole('button', { name: '1 notificações não lidas' })).toBeInTheDocument()
  })

  it('recarrega a lista ao reconectar', async () => {
    api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [ESTOQUE_BAIXO] })
    render(<AppTopbar />)

    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(0))
    const fonte = FakeEventSource.instances[0]
    // first open: no reload; second open (reconnect): reload the list
    act(() => fonte.emitir('open'))
    act(() => fonte.emitir('open'))

    expect(await screen.findByRole('button', { name: '1 notificações não lidas' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('fecha a conexão ao desmontar', async () => {
    api.get.mockResolvedValueOnce({ data: [] })
    const { unmount } = render(<AppTopbar />)

    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(0))
    const fonte = FakeEventSource.instances[0]
    unmount()
    expect(fonte.closed).toBe(true)
  })
})
