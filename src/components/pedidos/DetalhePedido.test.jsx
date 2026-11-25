import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import useSessao from '../sessao/useSessao'
import DetalhePedido from './DetalhePedido'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))
vi.mock('../../services/api', () => ({ default: { patch: vi.fn() } }))

const PEDIDO = {
  idPedido: 42,
  clienteId: 3,
  nomeCliente: 'Cliente Exemplo',
  statusPedido: 'EM_PRODUCAO',
  formaEntrega: 'ENTREGA',
  enderecoEntrega: 'Rua Exemplo, 100',
  dataEntrega: '2026-11-20',
  anotacao: 'Sem lactose',
}
const ITENS = [{ idProdutoPedido: 1, fkPedido: 42, fkProduto: 9, quantidade: 2, valorTotal: 80 }]
const PRODUTOS = [{ idProduto: 9, nome: 'Bolo de cenoura' }]
const PAGAMENTO = { pedidoId: 42, statusPagamento: 'AGUARDANDO_PAGAMENTO', valorTotal: 80, valorSinal: 40, valorRestante: 40, formaPagamentoSinal: 'PIX', dataPagamentoSinal: '2026-11-10' }

function renderizar(pedido = PEDIDO, { ehDona = true, onFechar = vi.fn() } = {}) {
  useSessao.mockReturnValue({ ehDona })
  render(
    <ToastProvider>
      <DetalhePedido pedido={pedido} clientes={[]} itens={ITENS} produtos={PRODUTOS} pagamento={PAGAMENTO} onFechar={onFechar} onPedidoAtualizado={vi.fn()} onEditar={vi.fn()} onCancelar={vi.fn()} />
    </ToastProvider>,
  )
  return onFechar
}

describe('DetalhePedido', () => {
  afterEach(() => vi.clearAllMocks())

  it('mostra dados, itens, pagamento e fase', () => {
    renderizar()
    const dialogo = screen.getByRole('dialog', { name: 'Pedido #0042' })
    expect(dialogo).toHaveTextContent('Cliente Exemplo')
    expect(dialogo).toHaveTextContent('Rua Exemplo, 100')
    expect(dialogo).toHaveTextContent('Bolo de cenoura ×2')
    expect(dialogo).toHaveTextContent('Aguardando pagamento')
    expect(dialogo).toHaveTextContent('Em produção')
    expect(screen.getByRole('button', { name: 'Marcar como pronto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pedido #0042' })).toHaveFocus()
  })

  it('sem ações em pedido finalizado', () => {
    renderizar({ ...PEDIDO, statusPedido: 'ENTREGUE' })
    expect(screen.queryByRole('button', { name: 'Editar pedido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Marcar|Iniciar|Confirmar/ })).not.toBeInTheDocument()
  })

  it('aguardando sinal aponta para o registro do sinal', () => {
    renderizar({ ...PEDIDO, statusPedido: 'AGUARDANDO_SINAL' })
    expect(screen.getByText('O pedido avança para a produção quando o sinal for registrado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Marcar|Iniciar|Confirmar/ })).not.toBeInTheDocument()
  })

  it('cancelar oculto para a FUNCIONARIA', () => {
    renderizar(PEDIDO, { ehDona: false })
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('cancelar visível para a DONA', () => {
    renderizar(PEDIDO, { ehDona: true })
    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
  })

  it('Esc fecha', () => {
    const onFechar = renderizar()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onFechar).toHaveBeenCalled()
  })

  it('a FUNCIONARIA não vê valores dos itens nem o pagamento', () => {
    renderizar(PEDIDO, { ehDona: false })

    expect(screen.getByRole('dialog')).not.toHaveTextContent('R$')
    expect(screen.queryByRole('region', { name: 'Pagamento' })).not.toBeInTheDocument()
    expect(screen.getByText(/Bolo de cenoura/)).toBeInTheDocument()
  })
})
