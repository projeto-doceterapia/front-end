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

async function abrirExclusao() {
  render(<Estoque />)
  await screen.findByText('Farinha de Trigo')
  fireEvent.click(screen.getByRole('button', { name: 'Editar Farinha de Trigo' }))
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
    api.get.mockImplementation((url) =>
      url === '/insumos'
        ? Promise.resolve({ data: [INSUMO] })
        : Promise.resolve({ data: [CATEGORIA] }),
    )
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
    expect(screen.getByText('Farinha de Trigo')).toBeInTheDocument()
  })
})
