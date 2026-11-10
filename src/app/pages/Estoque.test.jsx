import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Estoque from './Estoque'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const INSUMO = {
  idInsumo: 7,
  nome: 'Farinha de Trigo',
  quantidadeAtual: 10,
  quantidadeMinima: 5,
  unidade: 'KG',
  categoriaId: 1,
  categoriaNome: 'Base',
  status: 'ATIVO',
}

const CATEGORIA = { idCategoriaInsumo: 1, nome: 'Base' }

// Server reply for DELETE /insumos/{id} when the supply has movements.
const CONFLITO_MOVIMENTOS = {
  response: {
    status: 409,
    data: { message: 'Insumo possui movimentações de estoque. Inative-o em vez de excluir.' },
  },
}

function respostaPadrao(url) {
  if (url === '/insumos') return Promise.resolve({ data: [INSUMO] })
  if (url === '/estoque/movimentos') return Promise.resolve({ data: [] })
  return Promise.resolve({ data: [CATEGORIA] })
}

async function abrirExclusao() {
  render(<Estoque />)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Farinha de Trigo' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir insumo' }))
  fireEvent.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))
}

describe('Estoque - exclusão com movimentações', () => {
  let dialogShowModalOriginal
  let dialogCloseOriginal

  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom does not implement the native <dialog> methods used by ModalEstoque.
    // Toggle the open attribute so the dialog content is in the accessibility tree,
    // keeping the originals so afterEach can restore them.
    dialogShowModalOriginal = HTMLDialogElement.prototype.showModal
    dialogCloseOriginal = HTMLDialogElement.prototype.close
    HTMLDialogElement.prototype.showModal = function () { this.open = true }
    HTMLDialogElement.prototype.close = function () { this.open = false }
    api.get.mockImplementation(respostaPadrao)
  })

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = dialogShowModalOriginal
    HTMLDialogElement.prototype.close = dialogCloseOriginal
  })

  it('mostra a mensagem PT-BR do servidor no padrão de erro acessível da página', async () => {
    api.delete.mockRejectedValueOnce(CONFLITO_MOVIMENTOS)
    await abrirExclusao()

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/insumos/7'))
    const alerta = await screen.findByText(CONFLITO_MOVIMENTOS.response.data.message)
    expect(alerta).toHaveAttribute('role', 'alert')
  })

  it('sugere inativar quando a mensagem do servidor orienta isso', async () => {
    api.delete.mockRejectedValueOnce(CONFLITO_MOVIMENTOS)
    await abrirExclusao()

    expect(await screen.findByText(/Inative-o/)).toBeInTheDocument()
  })

  it('mantém o insumo na lista após o 409', async () => {
    api.delete.mockRejectedValueOnce(CONFLITO_MOVIMENTOS)
    await abrirExclusao()

    await screen.findByText(CONFLITO_MOVIMENTOS.response.data.message)
    expect(screen.getByRole('button', { name: 'Editar Farinha de Trigo' })).toBeInTheDocument()
  })
})

describe('Estoque - movimentações recentes', () => {
  const MOVIMENTO = {
    idMovimentacao: 58, insumoId: 7, tipo: 'ENTRADA_COMPRA', quantidade: 2, ocorridoEm: '2026-11-03T09:12:00',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 3, 10, 0) })
    api.get.mockImplementation((url) => (url === '/estoque/movimentos'
      ? Promise.resolve({ data: [MOVIMENTO] })
      : respostaPadrao(url)))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('abre com as movimentações dos últimos 30 dias', async () => {
    render(<Estoque />)

    expect(await screen.findByText('Entrada de compra')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/estoque/movimentos', { params: { de: '2026-10-04', ate: '2026-11-03' } })
  })

  it('amplia o período e filtra por insumo', async () => {
    render(<Estoque />)
    await screen.findByText('Entrada de compra')

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-08-01' } })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      '/estoque/movimentos', { params: { de: '2026-08-01', ate: '2026-11-03' } }))

    fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: '7' } })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      '/estoque/movimentos', { params: { de: '2026-08-01', ate: '2026-11-03', insumoId: '7' } }))
  })

  it('mostra a mensagem de vazio e o erro com nova tentativa', async () => {
    api.get.mockImplementation((url) => (url === '/estoque/movimentos'
      ? Promise.resolve({ data: [] })
      : respostaPadrao(url)))
    const { unmount } = render(<Estoque />)
    expect(await screen.findByText('Nenhuma movimentação neste período.')).toBeInTheDocument()
    unmount()

    api.get.mockImplementation((url) => (url === '/estoque/movimentos'
      ? Promise.reject(new Error('falha'))
      : respostaPadrao(url)))
    render(<Estoque />)
    const alerta = await screen.findByText('Não foi possível carregar as movimentações.')
    expect(alerta.closest('[role="alert"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
