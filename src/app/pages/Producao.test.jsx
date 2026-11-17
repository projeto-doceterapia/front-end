import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => vi.clearAllMocks())

  it('estados de carga: carregando', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando pedidos...')).toHaveAttribute('role', 'status')
    expect(screen.queryByText('Nenhum pedido corresponde a este filtro.')).not.toBeInTheDocument()
  })

  it('estados de carga: vazio', async () => {
    responder([])
    renderizar()
    expect(await screen.findByText('Nenhum pedido corresponde a este filtro.')).toBeInTheDocument()
    expect(screen.queryByText('Carregando pedidos...')).not.toBeInTheDocument()
  })

  it('estados de carga: erro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockRejectedValue(new Error('Network Error'))
    renderizar()
    expect(await screen.findByText(/Não foi possível carregar os pedidos de produção/)).toHaveAttribute('role', 'alert')
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
