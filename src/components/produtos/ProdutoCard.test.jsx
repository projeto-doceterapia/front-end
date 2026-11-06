import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ProdutoCard from './ProdutoCard'
import api from '../../services/api'
import useSessao from '../sessao/useSessao'

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))

const PRODUTO = {
  idProduto: 1,
  nome: 'Bolo Exemplo',
  categoriaNome: 'Bolos',
  precoAtual: 80,
  custoEstimado: 30,
  precoSugerido: 60,
}

function simularPerfil(perfil) {
  useSessao.mockReturnValue({ perfil, ehDona: perfil === 'DONA' })
}

async function abrirDetalhes() {
  render(<ProdutoCard produto={PRODUTO} aoEditar={vi.fn()} />)
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/produtos/1/insumos'))
  fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
}

describe('ProdutoCard por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('mostra editar e a precificação para a DONA', async () => {
    simularPerfil('DONA')
    await abrirDetalhes()

    expect(screen.getByRole('button', { name: 'Editar Bolo Exemplo' })).toBeInTheDocument()
    expect(screen.getByLabelText('Precificação estimada')).toBeInTheDocument()
    expect(screen.getByText('Custo estimado')).toBeInTheDocument()
  })

  it('oculta editar, custo, lucro e margem para a FUNCIONARIA e mantém o preço de venda', async () => {
    simularPerfil('FUNCIONARIA')
    await abrirDetalhes()

    expect(screen.queryByRole('button', { name: 'Editar Bolo Exemplo' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Precificação estimada')).not.toBeInTheDocument()
    expect(screen.queryByText('Custo estimado')).not.toBeInTheDocument()
    expect(screen.queryByText('Lucro estimado')).not.toBeInTheDocument()
    expect(screen.getByText('Preço')).toBeInTheDocument()
    expect(screen.getByText(/80,00/)).toBeInTheDocument()
  })
})
