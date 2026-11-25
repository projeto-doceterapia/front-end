import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListaPedidos from './ListaPedidos'

const PEDIDOS = [
  { idPedido: 1, nomeCliente: 'Cliente Exemplo', statusPedido: 'EM_PRODUCAO', dataEntrega: '2026-11-24', formaEntrega: 'RETIRADA', tipoPedido: 'PEDIDO_CONFIRMADO' },
  { idPedido: 2, nomeCliente: 'Cliente Teste', statusPedido: 'ESPERANDO_FAZER', dataEntrega: '2026-11-24', formaEntrega: 'RETIRADA', tipoPedido: 'PEDIDO_CONFIRMADO' },
]
const ITENS = [{ fkPedido: 1, fkProduto: 9, quantidade: 1, valorTotal: 50 }]
const PRODUTOS = [{ idProduto: 9, nome: 'Bolo Exemplo' }]
const PAGAMENTOS = [{ pedidoId: 1, statusPagamento: 'AGUARDANDO_PAGAMENTO' }, { pedidoId: 2, statusPagamento: 'PAGO_INTEGRAL' }]

describe('ListaPedidos', () => {
  it('mostra fase e pagamento com os rótulos em PT-BR', () => {
    render(<ListaPedidos pedidos={PEDIDOS} pagamentos={PAGAMENTOS} itens={ITENS} produtos={PRODUTOS} dataSelecionada="2026-11-24" />)

    expect(screen.getByText('Em produção')).toBeInTheDocument()
    expect(screen.getByText('Aguardando produção')).toBeInTheDocument()
    expect(screen.getByText('Aguardando pagamento')).toBeInTheDocument()
    expect(screen.getByText('Pago')).toBeInTheDocument()
    expect(screen.getByText('Pedido sem produtos')).toBeInTheDocument()
  })
})
