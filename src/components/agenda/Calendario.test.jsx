import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Calendario from './Calendario'

const FAROL = { limiteVerde: 1, limiteAmarelo: 2, limiteVermelho: 3 }

function pedido(idPedido, dataEntrega) {
  return { idPedido, dataEntrega, nomeCliente: 'Cliente Exemplo' }
}

function renderizar(farol, pedidos = []) {
  return render(
    <Calendario pedidos={pedidos} farol={farol} mesExibido={new Date(2026, 10, 1)} dataSelecionada="2026-11-24"
      aoMudarMes={vi.fn()} aoIrParaHoje={vi.fn()} aoSelecionarData={vi.fn()} />,
  )
}

describe('Calendario - lotação', () => {
  it('mostra a legenda com as mesmas faixas usadas nos dias', () => {
    const { container } = renderizar(FAROL)

    expect(container.querySelector('.calendar-footer')).toHaveTextContent('Livre: 1 pedido')
    expect(container.querySelector('.calendar-footer')).toHaveTextContent('Quase cheio: 2 pedidos')
    expect(container.querySelector('.calendar-footer')).toHaveTextContent('Lotado: 3 ou mais')
  })

  it('escreve o nível e a quantidade em cada dia com a mesma cor da legenda', () => {
    renderizar(FAROL, [pedido(1, '2026-11-10'), pedido(2, '2026-11-12'), pedido(3, '2026-11-12'), pedido(4, '2026-11-12')])

    const livre = screen.getByText('Livre · 1 pedido').closest('button')
    const lotado = screen.getByText('Lotado · 3 pedidos').closest('button')
    expect(livre).toHaveClass('free')
    expect(lotado).toHaveClass('full')
  })

  it('marca o dia selecionado', () => {
    renderizar(FAROL)

    expect(screen.getByRole('button', { name: '24' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '24' })).toHaveClass('selected')
  })

  it('pede os limites em vez de mostrar NaN quando faltam', () => {
    const { container } = renderizar([])

    expect(container.querySelector('.calendar-footer')).not.toHaveTextContent('NaN')
    expect(screen.getByText(/defina os limites/i)).toBeInTheDocument()
  })
})
