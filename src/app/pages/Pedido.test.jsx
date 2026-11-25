import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Pedido from './Pedido'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

describe('Pedido', () => {
  it('lista só clientes ativos para escolher', async () => {
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data:
          url === '/clientes'
            ? [
                { idCliente: 1, nome: 'Cliente Exemplo', status: 'ATIVO' },
                { idCliente: 2, nome: 'Cliente Inativo', status: 'INATIVO' },
              ]
            : [],
      })
    )
    render(<Pedido onBack={vi.fn()} />)

    expect(await screen.findByRole('option', { name: 'Cliente Exemplo' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Cliente Inativo' })).not.toBeInTheDocument()
  })

  it('explica cada campo inválido e liga a mensagem ao campo', async () => {
    api.get.mockResolvedValue({ data: [] })
    render(<Pedido onBack={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continuar: escolher itens' }))

    const cliente = screen.getByRole('combobox', { name: /Cliente/ })
    expect(cliente).toHaveAttribute('aria-invalid', 'true')
    expect(cliente).toHaveAccessibleDescription('Escolha um cliente.')
    expect(screen.getByLabelText(/Data de entrega/)).toHaveAccessibleDescription('Escolha a data de entrega.')
    expect(screen.getByText('Revise os campos destacados para continuar.')).toBeInTheDocument()
  })

  it('mostra a data escolhida por extenso', async () => {
    api.get.mockResolvedValue({ data: [] })
    render(<Pedido onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Data de entrega/), { target: { value: '2099-11-29' } })

    expect(screen.getByText('domingo, 29 de novembro de 2099')).toBeInTheDocument()
  })
})
