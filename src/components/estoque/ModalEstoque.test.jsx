import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useState } from 'react'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import ModalEstoque from './ModalEstoque'

function Tela({ aoFechar, ocupado = false }) {
  const [aberto, setAberto] = useState(false)

  function fechar() {
    aoFechar()
    setAberto(false)
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>Novo Insumo</button>
      {aberto && (
        <ModalEstoque titulo="Novo Insumo" aoFechar={fechar} ocupado={ocupado}>
          <label>Nome <input name="nome" /></label>
        </ModalEstoque>
      )}
    </>
  )
}

function abrir(props) {
  render(<Tela aoFechar={vi.fn()} {...props} />)
  const gatilho = screen.getByRole('button', { name: 'Novo Insumo' })
  gatilho.focus()
  fireEvent.click(gatilho)
  return gatilho
}

function pressionarEsc() {
  const dialogo = screen.getByRole('dialog')
  fireEvent(dialogo, createEvent('cancel', dialogo, { cancelable: true }))
}

describe('ModalEstoque', () => {
  let showModalOriginal
  let closeOriginal
  let showModal

  beforeEach(() => {
    // jsdom does not implement the native <dialog> methods.
    showModalOriginal = HTMLDialogElement.prototype.showModal
    closeOriginal = HTMLDialogElement.prototype.close
    showModal = vi.fn(function () { this.open = true })
    HTMLDialogElement.prototype.showModal = showModal
    HTMLDialogElement.prototype.close = function () { this.open = false }
  })

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = showModalOriginal
    HTMLDialogElement.prototype.close = closeOriginal
  })

  it('abre como diálogo modal com nome igual ao título', () => {
    abrir()

    const dialogo = screen.getByRole('dialog', { name: 'Novo Insumo' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(showModal).toHaveBeenCalledTimes(1)
  })

  it('fecha com Esc e devolve o foco ao gatilho', () => {
    const aoFechar = vi.fn()
    const gatilho = abrir({ aoFechar })

    pressionarEsc()

    expect(aoFechar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(gatilho).toHaveFocus()
  })

  it('não fecha com Esc enquanto está ocupado', () => {
    const aoFechar = vi.fn()
    abrir({ aoFechar, ocupado: true })

    pressionarEsc()

    expect(aoFechar).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
