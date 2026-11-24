import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import useSessao from '../../components/sessao/useSessao'
import Agenda from './Agenda'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const PEDIDOS = [
  { idPedido: 7, nomeCliente: 'Cliente Exemplo', tipoPedido: 'ENCOMENDA', statusPedido: 'EM_PRODUCAO', dataEntrega: '2026-11-18' },
]

function responder(pedidos = PEDIDOS) {
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/pedidos' ? pedidos : [] }))
}

function chamadasPedidos() {
  return api.get.mock.calls.filter(([url]) => url === '/pedidos').map(([, config]) => config.params)
}

function renderizar() {
  useSessao.mockReturnValue({ ehDona: true })
  render(<Agenda onNewOrder={vi.fn()} />)
}

describe('Agenda', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 16, 10))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('abre com hoje até hoje + 7 sem cancelados', async () => {
    responder()
    renderizar()
    expect(await screen.findByText('1 Pedido')).toBeInTheDocument()
    expect(chamadasPedidos()).toEqual([{ de: '2026-11-16', ate: '2026-11-23', status: 'ORCAMENTO,AGUARDANDO_SINAL,ESPERANDO_FAZER,EM_PRODUCAO,AGUARDANDO_ENTREGA,ENTREGUE' }])
    expect(screen.getByText('Pedidos no período')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dados de teste' })).toBeInTheDocument()
  })

  it('mostra carregamento', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando pedidos...')
    expect(document.querySelector('.agenda-layout')).toHaveAttribute('aria-busy', 'true')
  })

  it('mostra erro distinto do vazio', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockImplementation((url) => url === '/pedidos' ? Promise.reject(new Error('Network Error')) : Promise.resolve({ data: [] }))
    renderizar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os pedidos.')
    expect(screen.queryByText(/Nenhum pedido com entrega/)).not.toBeInTheDocument()
  })

  it('marca os dias fora do período carregado', async () => {
    responder()
    renderizar()
    await screen.findByText('1 Pedido')
    expect(screen.getByRole('button', { name: '15, dia fora do período carregado' })).toHaveClass('outside-range')
    expect(screen.queryByRole('button', { name: '16, dia fora do período carregado' })).not.toBeInTheDocument()
  })

  it('carrega o mês exibido sob demanda', async () => {
    responder()
    renderizar()
    await screen.findByText('1 Pedido')
    fireEvent.click(screen.getByRole('button', { name: 'Proximo mes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carregar este mês' }))
    await waitFor(() => expect(chamadasPedidos()).toHaveLength(2))
    expect(chamadasPedidos()[1]).toEqual({ de: '2026-12-01', ate: '2026-12-31', status: 'ORCAMENTO,AGUARDANDO_SINAL,ESPERANDO_FAZER,EM_PRODUCAO,AGUARDANDO_ENTREGA,ENTREGUE' })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Carregar este mês' })).not.toBeInTheDocument())
  })

  it('descarta a resposta de um filtro antigo', async () => {
    let responderAntigo
    api.get.mockImplementation((url, config) => {
      if (url !== '/pedidos') return Promise.resolve({ data: [] })
      if (config.params.de === '2026-11-16') return new Promise((resolve) => { responderAntigo = resolve })
      return Promise.resolve({ data: [{ ...PEDIDOS[0], idPedido: 8, nomeCliente: 'Cliente Novo', dataEntrega: '2026-12-02' }] })
    })
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: 'Proximo mes' }))
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-12-31' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Filtrar pedidos por período' }))
    expect(await screen.findByText('Cliente Novo')).toBeInTheDocument()
    responderAntigo({ data: PEDIDOS })
    await Promise.resolve()
    expect(screen.queryByText('Cliente Exemplo')).not.toBeInTheDocument()
  })
})
