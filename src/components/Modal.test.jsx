import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import Modal from './Modal'

function Tela({ aoFechar = vi.fn() }) {
  const [aberto, setAberto] = useState(false)

  function fechar() {
    aoFechar()
    setAberto(false)
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>Novo produto</button>
      {aberto && (
        <Modal titulo="Novo produto" aoFechar={fechar}>
          <form>
            <label>Nome <input name="nome" /></label>
            <label>Preço <input name="preco" /></label>
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </>
  )
}

function abrir(aoFechar) {
  render(<Tela aoFechar={aoFechar} />)
  const gatilho = screen.getByRole('button', { name: 'Novo produto' })
  gatilho.focus()
  fireEvent.click(gatilho)
  return gatilho
}

describe('Modal', () => {
  it('expõe papel e nome do diálogo', () => {
    abrir()

    const dialogo = screen.getByRole('dialog', { name: 'Novo produto' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Nome')).toHaveFocus()
  })

  it('fecha com Esc e devolve o foco', () => {
    const aoFechar = vi.fn()
    const gatilho = abrir(aoFechar)

    fireEvent.keyDown(screen.getByLabelText('Nome'), { key: 'Escape' })

    expect(aoFechar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(gatilho).toHaveFocus()
  })

  it('mantém o foco dentro do diálogo', () => {
    abrir()
    const fechar = screen.getByRole('button', { name: 'Fechar' })
    const salvar = screen.getByRole('button', { name: 'Salvar' })

    salvar.focus()
    fireEvent.keyDown(salvar, { key: 'Tab' })
    expect(fechar).toHaveFocus()

    fireEvent.keyDown(fechar, { key: 'Tab', shiftKey: true })
    expect(salvar).toHaveFocus()
  })
})
