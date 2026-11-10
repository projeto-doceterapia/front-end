import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ProdutoCard from './ProdutoCard'
import api from '../../services/api'
import useSessao from '../sessao/useSessao'
import renderComToast from '../../test/renderComToast'

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

async function abrirDetalhes(produto = PRODUTO) {
  renderComToast(<ProdutoCard produto={produto} aoEditar={vi.fn()} />)
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

  it('mostra o custo e o preço sugerido calculados, sem campo para editar', async () => {
    simularPerfil('DONA')
    await abrirDetalhes({ ...PRODUTO, custoEstimado: 7.84, precoSugerido: 16, precoAtual: 15 })

    const painel = screen.getByLabelText('Precificação estimada')
    expect(painel).toHaveTextContent(/R\$\s7,84/)
    expect(painel).toHaveTextContent(/R\$\s16,00/)
    expect(painel.querySelector('input')).toBeNull()
  })

  it('mostra traço quando o custo não pode ser calculado', async () => {
    simularPerfil('DONA')
    await abrirDetalhes({ ...PRODUTO, custoEstimado: null, precoSugerido: null })

    const painel = screen.getByLabelText('Precificação estimada')
    expect(painel).toHaveTextContent('Custo indisponível')
    expect(painel).not.toHaveTextContent('R$ 0,00')
  })

  it('indica a margem padrão ou a margem própria', async () => {
    simularPerfil('DONA')
    const { unmount } = renderComToast(<ProdutoCard produto={{ ...PRODUTO, margemLucro: null }} aoEditar={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
    expect(screen.getByText('Margem padrão')).toBeInTheDocument()
    unmount()

    renderComToast(<ProdutoCard produto={{ ...PRODUTO, margemLucro: 120 }} aoEditar={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
    expect(screen.getByText('Margem própria: 120%')).toBeInTheDocument()
  })

  it('mostra o selo de preço abaixo do sugerido só para a DONA', async () => {
    simularPerfil('DONA')
    const { unmount } = renderComToast(<ProdutoCard produto={{ ...PRODUTO, precoAtual: 15, precoSugerido: 16 }} aoEditar={vi.fn()} />)
    expect(screen.getByText('Preço abaixo do sugerido')).toBeInTheDocument()
    unmount()

    simularPerfil('FUNCIONARIA')
    renderComToast(<ProdutoCard produto={{ ...PRODUTO, precoAtual: 15, precoSugerido: 16 }} aoEditar={vi.fn()} />)
    expect(screen.queryByText('Preço abaixo do sugerido')).not.toBeInTheDocument()
  })

  it('mostra o selo sem ficha técnica aos dois perfis quando a ficha está vazia', async () => {
    simularPerfil('FUNCIONARIA')
    renderComToast(<ProdutoCard produto={PRODUTO} aoEditar={vi.fn()} />)

    expect(await screen.findByText('Sem ficha técnica')).toBeInTheDocument()
  })

  it('lista as linhas da ficha para a FUNCIONARIA sem ações de edição', async () => {
    simularPerfil('FUNCIONARIA')
    api.get.mockResolvedValue({
      data: [{ idProdutoInsumo: 1, fkInsumo: 7, nomeInsumo: 'Chocolate', quantidadeUtilizada: 250, unidade: 'G' }],
    })
    await abrirDetalhes()

    expect(await screen.findByText(/Chocolate — 250 g/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar insumo/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar Chocolate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover Chocolate' })).not.toBeInTheDocument()
    expect(screen.queryByText('Sem ficha técnica')).not.toBeInTheDocument()
  })
})
