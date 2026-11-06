import { describe, expect, it } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import useToast from '../components/feedback/useToast'
import renderComToast from './renderComToast'

function Tela({ texto = 'Salvar' }) {
  const toast = useToast()
  return <button type="button" onClick={() => toast.sucesso('Cliente salvo.')}>{texto}</button>
}

describe('renderComToast', () => {
  it('renderiza o elemento dentro do provider', () => {
    renderComToast(<Tela />)

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Salvar' })))

    expect(within(screen.getByRole('status')).getByText('Cliente salvo.')).toBeInTheDocument()
  })

  it('mantém o provider no rerender', () => {
    const { rerender } = renderComToast(<Tela />)

    rerender(<Tela texto="Salvar de novo" />)

    expect(screen.getByRole('button', { name: 'Salvar de novo' })).toBeInTheDocument()
  })
})
