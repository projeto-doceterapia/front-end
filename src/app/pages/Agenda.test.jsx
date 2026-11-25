import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import renderComToast from '../../test/renderComToast'
import Agenda from './Agenda'
import api from '../../services/api'
import { carregarPedidosComRelacionamentos } from '../../services/pedidosConsulta'

vi.mock('../../components/sessao/useSessao', () => ({
  default: () => ({ perfil: 'DONA', ehDona: true }),
}))

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('../../services/pedidosConsulta', async (importOriginal) => ({
  ...(await importOriginal()),
  carregarPedidosComRelacionamentos: vi.fn(),
}))

const SEM_PEDIDOS = { pedidos: [], pagamentos: [], itens: [] }

describe('Agenda - carregamento', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 24))
    vi.clearAllMocks()
    carregarPedidosComRelacionamentos.mockResolvedValue(SEM_PEDIDOS)
    api.get.mockImplementation((url) => (
      url === '/configuracao-farol'
        ? Promise.resolve({ data: { limiteVerde: 2, limiteAmarelo: 4, limiteVermelho: 6 } })
        : Promise.resolve({ data: [] })
    ))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('busca os pedidos do mês exibido e depois o farol', async () => {
    renderComToast(<Agenda onNewOrder={vi.fn()} />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/configuracao-farol'))
    expect(carregarPedidosComRelacionamentos).toHaveBeenCalledWith(
      expect.objectContaining({ de: '2026-11-01', ate: '2026-11-30' }),
    )
    expect(api.get).toHaveBeenCalledWith('/produtos')
  })

  it('busca de novo ao trocar de mês', async () => {
    renderComToast(<Agenda onNewOrder={vi.fn()} />)
    await waitFor(() => expect(carregarPedidosComRelacionamentos).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: /pr[oó]ximo m[eê]s/i }))

    await waitFor(() => expect(carregarPedidosComRelacionamentos).toHaveBeenLastCalledWith(
      expect.objectContaining({ de: '2026-12-01', ate: '2026-12-31' }),
    ))
  })

  it('não consulta o farol quando os pedidos falham', async () => {
    const erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    carregarPedidosComRelacionamentos.mockRejectedValue(new Error('offline'))
    renderComToast(<Agenda onNewOrder={vi.fn()} />)

    await waitFor(() => expect(erroConsole).toHaveBeenCalled())
    expect(api.get).not.toHaveBeenCalledWith('/configuracao-farol')
    expect(screen.getByRole('button', { name: 'Novo Pedido' })).toBeInTheDocument()
    erroConsole.mockRestore()
  })
})
