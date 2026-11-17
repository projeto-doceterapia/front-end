import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 16, 10))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('abre com os últimos 90 dias', async () => {
    responder()
    renderizar()
    await screen.findByRole('button', { name: 'Ver pedido 41' })
    expect(api.get).toHaveBeenCalledWith('/pedidos', expect.objectContaining({ params: { de: '2026-08-18', ate: '2026-11-16' } }))
    expect(api.get).toHaveBeenCalledWith('/pagamentos', expect.objectContaining({ params: { pedidoId: '41,42' } }))
  })

  it('amplia o período e volta à página 1', async () => {
    const pedidos = Array.from({ length: 10 }, (_, indice) => ({ ...PEDIDOS[0], idPedido: indice + 1 }))
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/pedidos' ? pedidos : [] }))
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Próxima página' }))
    expect(screen.getByText('9-10 de 10 pedidos')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('1-8 de 10 pedidos')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/pedidos', expect.objectContaining({ params: { de: '2026-01-01', ate: '2026-12-31' } }))
    expect(screen.getByText('Mostrando entregas de 01/01/2026 a 31/12/2026')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro do servidor', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockImplementation((url) => url === '/pedidos'
      ? Promise.reject({ response: { status: 400, data: { message: 'O período máximo por consulta é de 366 dias.' } } })
      : Promise.resolve({ data: [] }))
    renderizar()
    expect(await screen.findByText('O período máximo por consulta é de 366 dias.')).toHaveAttribute('role', 'alert')
    expect(screen.queryByText(/Nenhum pedido/)).not.toBeInTheDocument()
  })

  it('mostra estado vazio com o período', async () => {
    api.get.mockResolvedValue({ data: [] })
    renderizar()
    expect(await screen.findByText('Nenhum pedido com entrega entre 18/08/2026 e 16/11/2026.')).toBeInTheDocument()
  })

  it('estados de carga', async () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando pedidos...')).toHaveAttribute('role', 'status')
    expect(screen.queryByText('Nenhum pedido encontrado com esses filtros.')).not.toBeInTheDocument()
  })

  it('linha abre o detalhe', async () => {
    responder()
    renderizar()
    const linha = (await screen.findByRole('button', { name: 'Ver pedido 41' })).closest('tr')
    expect(within(linha).queryByRole('button', { name: 'Iniciar produção' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido 42' }))
    const dialogo = screen.getByRole('dialog', { name: 'Pedido #0042' })
    expect(dialogo).toHaveTextContent('Entregue')
    expect(dialogo).toHaveTextContent('Pago')
  })

  it('filtro por ESPERANDO_FAZER', async () => {
    responder()
    renderizar()
    await screen.findByRole('button', { name: 'Ver pedido 41' })
    expect(within(screen.getByLabelText('Resumo dos pedidos')).getByText('Aguardando produção').closest('article')).toHaveTextContent('1')
    fireEvent.click(screen.getByRole('button', { name: /Aguard\. produção/ }))
    expect(screen.getByRole('button', { name: 'Ver pedido 41' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver pedido 42' })).not.toBeInTheDocument()
  })

  it('selo de pagamento e forma do pagamento', async () => {
    responder()
    renderizar()
    const linha = (await screen.findByRole('button', { name: 'Ver pedido 42' })).closest('tr')
    expect(within(linha).getByText('Pix')).toBeInTheDocument()
    expect(within(linha).getByText('100% pago')).toBeInTheDocument()
  })

  it('editar pela linha atualiza a tabela', async () => {
    responder()
    api.put.mockResolvedValue({ data: { ...PEDIDOS[0], dataEntrega: '2026-11-12' } })
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar pedido 41' }))
    fireEvent.change(screen.getByLabelText('Data de entrega'), { target: { value: '2026-11-12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(screen.getByRole('button', { name: 'Ver pedido 41' }).closest('tr')).getAllByText('12/11').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Editar pedido 42' })).not.toBeInTheDocument()
  })
})
