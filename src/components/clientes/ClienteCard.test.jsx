import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ClienteCard from './ClienteCard'
import api from '../../services/api'
import useSessao from '../sessao/useSessao'

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))

const CLIENTE = {
  idCliente: 1,
  nome: 'Cliente Exemplo',
  telefone: '+55 11 90000-0001',
  endereco: 'Rua Exemplo, 10',
  tipoPessoa: 'FISICA',
  classificacaoCliente: 'PADRAO',
  totalPedidos: 2,
  gastoTotal: 150.5,
  ultimoPedido: '2026-11-01',
}
const PRODUTOS = [{ idProduto: 1, nome: 'Bolo de pote' }]
const PEDIDOS = [
  { idPedido: 5, dataCriacao: '2026-10-01T10:00:00' },
  { idPedido: 6, dataCriacao: '2026-11-01T10:00:00' },
]
const ITENS = [
  { fkPedido: 5, fkProduto: 1, quantidade: 2, valorTotal: 50 },
  { fkPedido: 6, fkProduto: 1, quantidade: 1, valorTotal: 100.5 },
]

function renderizar(cliente = CLIENTE, acoes = {}) {
  render(<ClienteCard cliente={cliente} produtos={PRODUTOS} aoEditar={vi.fn()} {...acoes} />)
}

function respostas({ pedidos = PEDIDOS, itens = ITENS } = {}) {
  api.get.mockImplementation((url) =>
    Promise.resolve({ data: url === '/pedidos' ? pedidos : itens })
  )
}

describe('ClienteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSessao.mockReturnValue({ perfil: 'DONA', ehDona: true })
  })

  it('mostra as métricas do resumo sem chamar a API', () => {
    renderizar()

    expect(screen.getByText('Pedidos').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Gasto total').nextSibling).toHaveTextContent(/150,50/)
    expect(screen.getByText('Último pedido').nextSibling).toHaveTextContent('01/11/2026')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('mostra um traço quando o gasto total não vem do servidor', () => {
    renderizar({ ...CLIENTE, gastoTotal: null })

    expect(screen.getByText('Gasto total').nextSibling).toHaveTextContent('—')
  })

  it('carrega o histórico ao expandir', async () => {
    respostas()
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Cliente Exemplo' }))

    expect(screen.getByText('Carregando pedidos...')).toBeInTheDocument()
    expect(await screen.findByText('#0006')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/pedidos', { params: { clienteId: 1 } })
    expect(api.get).toHaveBeenCalledWith('/itens-pedido', { params: { pedidoId: '5,6' } })
    expect(screen.getByText('Bolo de pote ×1')).toBeInTheDocument()
    expect(screen.getByText('Bolo de pote ×2')).toBeInTheDocument()
  })

  it('não repete a consulta ao recolher e expandir de novo', async () => {
    respostas()
    renderizar()
    const botao = screen.getByRole('button', { name: 'Expandir Cliente Exemplo' })

    fireEvent.click(botao)
    await screen.findByText('#0006')
    fireEvent.click(screen.getByRole('button', { name: 'Recolher Cliente Exemplo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Cliente Exemplo' }))

    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('avisa quando o cliente não tem pedidos', async () => {
    respostas({ pedidos: [] })
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Cliente Exemplo' }))

    expect(await screen.findByText('Este cliente ainda não possui pedidos.')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('erro no histórico', async () => {
    api.get.mockRejectedValueOnce(new Error('falha'))
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Cliente Exemplo' }))

    expect(
      await screen.findByText('Não foi possível carregar os pedidos deste cliente.')
    ).toBeInTheDocument()

    respostas()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('#0006')).toBeInTheDocument()
  })

  it('inativar só para a DONA', () => {
    const onInativar = vi.fn()
    renderizar({ ...CLIENTE, status: 'ATIVO' }, { onInativar })

    fireEvent.click(screen.getByRole('button', { name: 'Inativar Cliente Exemplo' }))

    expect(onInativar).toHaveBeenCalledTimes(1)
  })

  it('esconde inativar e reativar para a FUNCIONARIA', () => {
    useSessao.mockReturnValue({ perfil: 'FUNCIONARIA', ehDona: false })
    renderizar({ ...CLIENTE, status: 'ATIVO' })

    expect(screen.queryByRole('button', { name: /Inativar/ })).not.toBeInTheDocument()
  })

  it('cliente inativo mostra o selo e o botão de reativar', () => {
    const onReativar = vi.fn()
    renderizar({ ...CLIENTE, status: 'INATIVO' }, { onReativar })

    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inativar/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reativar Cliente Exemplo' }))
    expect(onReativar).toHaveBeenCalledTimes(1)
  })

  it('divide os itens em lotes de 200 pedidos', async () => {
    const muitos = Array.from({ length: 250 }, (_, indice) => ({
      idPedido: indice + 1,
      dataCriacao: '2026-10-01T10:00:00',
    }))
    respostas({ pedidos: muitos, itens: [] })
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Cliente Exemplo' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3))
    const lotes = api.get.mock.calls
      .filter(([url]) => url === '/itens-pedido')
      .map(([, config]) => config.params.pedidoId.split(',').length)
    expect(lotes).toEqual([200, 50])
  })
})
