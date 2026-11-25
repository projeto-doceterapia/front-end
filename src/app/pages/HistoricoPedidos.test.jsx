import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ToastProvider from '../../components/feedback/ToastProvider'
import useSessao from '../../components/sessao/useSessao'
import HistoricoPedidos from './HistoricoPedidos'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const PEDIDOS = [
  { idPedido: 41, nomeCliente: 'Cliente Exemplo', clienteId: 3, tipoPedido: 'PEDIDO_CONFIRMADO', statusPedido: 'ESPERANDO_FAZER', dataEntrega: '2026-11-10', formaEntrega: 'RETIRADA' },
  { idPedido: 42, nomeCliente: 'Cliente Teste', clienteId: 4, tipoPedido: 'PEDIDO_CONFIRMADO', statusPedido: 'ENTREGUE', dataEntrega: '2026-11-05', formaEntrega: 'RETIRADA' },
]
const PAGAMENTOS = [{ pedidoId: 42, statusPagamento: 'PAGO_INTEGRAL', valorTotal: 80, formaPagamentoRestante: 'PIX' }]
const CLIENTES = [{ idCliente: 3, nome: 'Cliente Exemplo' }, { idCliente: 4, nome: 'Cliente Teste' }]

function responder() {
  api.get.mockImplementation((url) => {
    if (url === '/pedidos') return Promise.resolve({ data: PEDIDOS })
    if (url === '/pagamentos') return Promise.resolve({ data: PAGAMENTOS })
    if (url === '/clientes') return Promise.resolve({ data: CLIENTES })
    return Promise.resolve({ data: [] })
  })
}

function renderizar() {
  useSessao.mockReturnValue({ ehDona: true })
  render(<ToastProvider><HistoricoPedidos onNewOrder={vi.fn()} /></ToastProvider>)
}

describe('HistoricoPedidos', () => {
  afterEach(() => vi.clearAllMocks())

  it('estados de carga', async () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando pedidos...')).toHaveAttribute('role', 'status')
    expect(screen.queryByText('Nenhum pedido encontrado com esses filtros.')).not.toBeInTheDocument()
  })

  it('linha abre o detalhe', async () => {
    responder()
    renderizar()
    const linha = (await screen.findByRole('button', { name: 'Ver pedido #0041' })).closest('tr')
    expect(within(linha).queryByRole('button', { name: 'Iniciar produção' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido #0042' }))
    const dialogo = screen.getByRole('dialog', { name: 'Pedido #0042' })
    expect(dialogo).toHaveTextContent('Entregue')
    expect(dialogo).toHaveTextContent('Pago')
  })

  it('filtro por ESPERANDO_FAZER', async () => {
    responder()
    renderizar()
    await screen.findByRole('button', { name: 'Ver pedido #0041' })
    expect(within(screen.getByLabelText('Resumo dos pedidos')).getByText('Aguardando produção').closest('article')).toHaveTextContent('1')
    fireEvent.click(screen.getByRole('button', { name: /^Aguardando produção/ }))
    expect(screen.getByRole('button', { name: 'Ver pedido #0041' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver pedido #0042' })).not.toBeInTheDocument()
  })

  it('selo de pagamento e forma do pagamento', async () => {
    responder()
    renderizar()
    const linha = (await screen.findByRole('button', { name: 'Ver pedido #0042' })).closest('tr')
    expect(within(linha).getByText('Pago')).toBeInTheDocument()
    expect(within(linha).getByText('Pago R$ 80,00 de R$ 80,00')).toBeInTheDocument()
    expect(linha.querySelector('.payment-progress')).toHaveClass('completo')
  })

  it('editar pela linha atualiza a tabela', async () => {
    responder()
    api.put.mockResolvedValue({ data: { ...PEDIDOS[0], dataEntrega: '2026-11-12' } })
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar pedido #0041' }))
    fireEvent.change(screen.getByLabelText('Data de entrega'), { target: { value: '2026-11-12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(screen.getByRole('button', { name: 'Ver pedido #0041' }).closest('tr')).getAllByText('12/11').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Editar pedido #0042' })).not.toBeInTheDocument()
  })

  it('a FUNCIONARIA não vê valores nem pagamento', async () => {
    responder()
    useSessao.mockReturnValue({ ehDona: false })
    render(<ToastProvider><HistoricoPedidos onNewOrder={vi.fn()} /></ToastProvider>)
    const linha = (await screen.findByRole('button', { name: 'Ver pedido #0042' })).closest('tr')

    expect(screen.queryByRole('columnheader', { name: 'Valor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Pagamento' })).not.toBeInTheDocument()
    expect(linha).not.toHaveTextContent('R$')
  })
})
