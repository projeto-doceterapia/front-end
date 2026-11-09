import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
