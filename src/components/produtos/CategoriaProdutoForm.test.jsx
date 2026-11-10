import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import CategoriaProdutoForm from './CategoriaProdutoForm'
import renderComToast from '../../test/renderComToast'
import instalarApiFalsa from '../../test/apiFalsa'

describe('CategoriaProdutoForm', () => {
  it('cria categoria', async () => {
    const api = instalarApiFalsa({
      'POST /categorias-produto': { status: 201, data: { idCategoriaProduto: 5, nome: 'Bolos de festa' } },
    })
    const aoSalva = vi.fn()
    renderComToast(<CategoriaProdutoForm categoria={null} aoFechar={vi.fn()} aoSalva={aoSalva} />)

    expect(screen.getByRole('dialog', { name: 'Nova categoria' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Bolos de festa' } })
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Bolos inteiros sob encomenda' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar categoria' }))

    await waitFor(() => expect(aoSalva).toHaveBeenCalledTimes(1))
    expect(JSON.parse(api.chamadasDe('POST /categorias-produto')[0].corpo)).toEqual({
      nome: 'Bolos de festa',
      descricao: 'Bolos inteiros sob encomenda',
    })
    expect(screen.getByText('Categoria salva.')).toBeInTheDocument()
  })

  it('renomeia categoria', async () => {
    const api = instalarApiFalsa({
      'PUT /categorias-produto/5': { status: 200, data: { idCategoriaProduto: 5, nome: 'Bolos' } },
    })
    const aoSalva = vi.fn()
    const categoria = { idCategoriaProduto: 5, nome: 'Bolos de festa', descricao: 'Sob encomenda' }
    renderComToast(<CategoriaProdutoForm categoria={categoria} aoFechar={vi.fn()} aoSalva={aoSalva} />)

    expect(screen.getByRole('dialog', { name: 'Editar categoria' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Bolos de festa')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Bolos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar categoria' }))

    await waitFor(() => expect(aoSalva).toHaveBeenCalledTimes(1))
    expect(JSON.parse(api.chamadasDe('PUT /categorias-produto/5')[0].corpo)).toEqual({
      nome: 'Bolos',
      descricao: 'Sob encomenda',
    })
  })

  it('avisa nome repetido e mantém o diálogo', async () => {
    instalarApiFalsa({ 'POST /categorias-produto': { status: 409, data: null } })
    const aoSalva = vi.fn()
    renderComToast(<CategoriaProdutoForm categoria={null} aoFechar={vi.fn()} aoSalva={aoSalva} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Bolos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar categoria' }))

    expect(await screen.findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
    expect(aoSalva).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nome')).toHaveValue('Bolos')
  })

  it('fecha com Esc', () => {
    const aoFechar = vi.fn()
    renderComToast(<CategoriaProdutoForm categoria={null} aoFechar={aoFechar} aoSalva={vi.fn()} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(aoFechar).toHaveBeenCalledTimes(1)
  })
})
