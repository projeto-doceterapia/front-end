import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClienteCard from './ClienteCard'
import useSessao from '../sessao/useSessao'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))

const CLIENTE = {
  idCliente: 1,
  nome: 'Cliente Exemplo',
  telefone: '+55 11 90000-0001',
  endereco: 'Rua Exemplo, 10',
  tipoPessoa: 'FISICA',
  classificacaoCliente: 'PADRAO',
}
const PEDIDOS = [{ idPedido: 5, dataCriacao: '2026-11-01T10:00:00' }]
const ITENS = [{ fkPedido: 5, fkProduto: 1, quantidade: 1, valorTotal: 50 }]

function renderizar() {
  render(<ClienteCard cliente={CLIENTE} pedidos={PEDIDOS} itens={ITENS} produtos={[]} aoEditar={vi.fn()} />)
}

describe('ClienteCard por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o gasto total para a DONA', () => {
    useSessao.mockReturnValue({ perfil: 'DONA', ehDona: true })
    renderizar()

    expect(screen.getByText('Gasto total').nextSibling).toHaveTextContent(/50,00/)
  })

  it('mostra um traço no gasto total para a FUNCIONARIA', () => {
    useSessao.mockReturnValue({ perfil: 'FUNCIONARIA', ehDona: false })
    renderizar()

    expect(screen.getByText('Gasto total').nextSibling).toHaveTextContent('—')
    expect(screen.queryByText(/50,00/)).not.toBeInTheDocument()
    expect(screen.getByText('Pedidos').nextSibling).toHaveTextContent('1')
  })
})
