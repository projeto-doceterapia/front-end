import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import CabecalhoAgenda from './CabecalhoAgenda'

describe('CabecalhoAgenda', () => {
  it('não oferece carga de dados de teste', () => {
    const { container } = render(<CabecalhoAgenda aoCriarPedido={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /dados de teste/i })).not.toBeInTheDocument()
    const acoes = within(container.querySelector('.agenda-actions')).getAllByRole('button')
    expect(acoes).toHaveLength(1)
    expect(acoes[0]).toHaveAccessibleName('Novo Pedido')
  })

  it('aciona a criação de pedido', () => {
    const aoCriarPedido = vi.fn()
    render(<CabecalhoAgenda aoCriarPedido={aoCriarPedido} />)

    screen.getByRole('button', { name: 'Novo Pedido' }).click()

    expect(aoCriarPedido).toHaveBeenCalledTimes(1)
  })
})
