import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ToastProvider from '../../components/feedback/ToastProvider'
import useSessao from '../../components/sessao/useSessao'
import Producao from './Producao'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const PEDIDOS = [
  { idPedido: 42, nomeCliente: 'Cliente Exemplo', statusPedido: 'EM_PRODUCAO', dataEntrega: '2026-11-20', formaEntrega: 'RETIRADA' },
]

function responder(pedidos = PEDIDOS) {
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/pedidos' ? pedidos : [] }))
}

function renderizar() {
  useSessao.mockReturnValue({ ehDona: true })
  render(<ToastProvider><Producao onNewOrder={vi.fn()} /></ToastProvider>)
}

describe('Producao', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 16, 10))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('estados de carga: carregando', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando pedidos...')).toHaveAttribute('role', 'status')
    expect(screen.queryByText('Nenhum pedido corresponde a este filtro.')).not.toBeInTheDocument()
  })

  it('mostra estado vazio com o período', async () => {
    responder([])
    renderizar()
    expect(await screen.findByText('Nenhum pedido com entrega entre 17/10/2026 e 23/11/2026.')).toBeInTheDocument()
    expect(screen.queryByText('Carregando pedidos...')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/itens-pedido', expect.anything())
    expect(api.get).not.toHaveBeenCalledWith('/pagamentos', expect.anything())
  })

  it('abre com as etapas ativas de hoje − 30 a hoje + 7', async () => {
    responder()
    renderizar()
    await screen.findByRole('button', { name: 'Abrir pedido 42' })
    expect(api.get).toHaveBeenCalledWith('/pedidos', expect.objectContaining({
      params: { de: '2026-10-17', ate: '2026-11-23', status: 'AGUARDANDO_SINAL,ESPERANDO_FAZER,EM_PRODUCAO,AGUARDANDO_ENTREGA' },
    }))
    expect(api.get).toHaveBeenCalledWith('/itens-pedido', expect.objectContaining({ params: { pedidoId: '42' } }))
  })

  it('pagina localmente o recorte', async () => {
    const pedidos = Array.from({ length: 9 }, (_, indice) => ({ ...PEDIDOS[0], idPedido: indice + 1, dataEntrega: `2026-11-${String(indice + 10).padStart(2, '0')}` }))
    responder(pedidos)
    renderizar()
    expect(await screen.findByText('1-6 de 9 pedidos')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByText('7-9 de 9 pedidos')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Abrir pedido/ })).toHaveLength(3)
  })

  it('reaplica o filtro de etapas e volta à página 1', async () => {
    responder(Array.from({ length: 9 }, (_, indice) => ({ ...PEDIDOS[0], idPedido: indice + 1 })))
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Próxima página' }))
    fireEvent.click(screen.getByLabelText('Aguardando sinal'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('1-6 de 9 pedidos')).toBeInTheDocument()
    expect(api.get).toHaveBeenLastCalledWith('/pagamentos', expect.anything())
    expect(api.get.mock.calls.filter(([url]) => url === '/pedidos')[1][1].params.status).toBe('ESPERANDO_FAZER,EM_PRODUCAO,AGUARDANDO_ENTREGA')
  })

  it('estados de carga: erro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockRejectedValue(new Error('Network Error'))
    renderizar()
    expect(await screen.findByText(/Não foi possível carregar os pedidos/)).toHaveAttribute('role', 'alert')
    expect(screen.queryByText('Nenhum pedido corresponde a este filtro.')).not.toBeInTheDocument()
  })

  it('seta abre o detalhe', async () => {
    responder()
    renderizar()
    const seta = await screen.findByRole('button', { name: 'Abrir pedido 42' })
    seta.focus()
    fireEvent.click(seta)

    const dialogo = screen.getByRole('dialog', { name: 'Pedido #0042' })
    expect(dialogo).toHaveTextContent('Cliente Exemplo')
    fireEvent.keyDown(dialogo, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(seta).toHaveFocus()
  })

  it('cartão reflete o avanço de fase', async () => {
    responder()
    api.patch.mockResolvedValue({ data: { ...PEDIDOS[0], statusPedido: 'AGUARDANDO_ENTREGA' } })
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como pronto' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Marcar como entregue' })).toBeInTheDocument())
    expect(screen.getAllByText('Aguardando entrega').length).toBeGreaterThan(0)
  })
})
