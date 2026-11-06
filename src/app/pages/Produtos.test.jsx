import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Produtos from './Produtos'
import api from '../../services/api'
import useSessao from '../../components/sessao/useSessao'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const PRODUTO = {
  idProduto: 1,
  nome: 'Bolo Exemplo',
  categoriaId: 1,
  categoriaNome: 'Bolos',
  precoAtual: 80,
  custoEstimado: 30,
}

async function abrir(perfil) {
  useSessao.mockReturnValue({ perfil, ehDona: perfil === 'DONA' })
  render(<Produtos />)
  await screen.findByText('Bolo Exemplo')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/produtos/1/insumos'))
}

describe('Produtos por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/produtos' ? [PRODUTO] : (url === '/categorias-produto' ? [{ idCategoriaProduto: 1, nome: 'Bolos' }] : []),
    }))
  })

  it('mostra Novo Produto para a DONA', async () => {
    await abrir('DONA')

    expect(screen.getByRole('button', { name: /Novo Produto/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar Bolo Exemplo' })).toBeInTheDocument()
  })

  it('oculta Novo Produto e Editar para a FUNCIONARIA e mantém o catálogo e as categorias', async () => {
    await abrir('FUNCIONARIA')

    expect(screen.queryByRole('button', { name: /Novo Produto/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar Bolo Exemplo' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument()
    expect(screen.getByText(/80,00/)).toBeInTheDocument()
  })
})
