import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import IndicadorFaltaInsumo from './IndicadorFaltaInsumo'
import PedidoProducaoCard from './PedidoProducaoCard'
import TabelaHistoricoPedidos from './TabelaHistoricoPedidos'

vi.mock('../../services/api', () => ({ default: { patch: vi.fn() } }))

const PEDIDO = { idPedido: 42, statusPedido: 'ESPERANDO_FAZER', dataEntrega: '2026-11-20', confirmadoComFaltaInsumo: true }
const TEXTO = 'Confirmado com falta de insumo'

describe('IndicadorFaltaInsumo', () => {
  it('aparece só quando confirmado com falta', () => {
    const { rerender } = render(<IndicadorFaltaInsumo pedido={PEDIDO} />)
    expect(screen.getByText(TEXTO)).toBeInTheDocument()
    rerender(<IndicadorFaltaInsumo pedido={{ ...PEDIDO, confirmadoComFaltaInsumo: false }} />)
    expect(screen.queryByText(TEXTO)).not.toBeInTheDocument()
    rerender(<IndicadorFaltaInsumo pedido={{ idPedido: 1 }} />)
    expect(screen.queryByText(TEXTO)).not.toBeInTheDocument()
  })

  it('mostra o indicador de falta no cartão da produção', () => {
    render(
      <ToastProvider>
        <PedidoProducaoCard pedido={PEDIDO} clientes={[]} itens={[]} produtos={[]} onAbrir={vi.fn()} onPedidoAtualizado={vi.fn()} />
      </ToastProvider>,
    )
    expect(screen.getByText(TEXTO)).toBeInTheDocument()
  })

  it('mostra o indicador de falta na linha do histórico', () => {
    render(<TabelaHistoricoPedidos pedidos={[PEDIDO]} clientes={[]} itens={[]} produtos={[]} pagamentos={[]} onAbrir={vi.fn()} onEditar={vi.fn()} />)
    expect(screen.getByText(TEXTO)).toBeInTheDocument()
  })
})
