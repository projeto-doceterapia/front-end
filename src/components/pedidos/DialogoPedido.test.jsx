import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DialogoPedido from './DialogoPedido'

function AcaoQueSome() {
  const [feita, setFeita] = useState(false)
  return feita ? <p>Fase atualizada</p> : <button type="button" onClick={() => setFeita(true)}>Avançar</button>
}

describe('DialogoPedido', () => {
  it('mantém o foco no diálogo quando o botão usado some', async () => {
    const onFechar = vi.fn()
    render(<DialogoPedido titulo="Pedido #0101" onFechar={onFechar} rodape={<AcaoQueSome />}><p>Itens</p></DialogoPedido>)
    const avancar = screen.getByRole('button', { name: 'Avançar' })
    avancar.focus()

    fireEvent.click(avancar)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pedido #0101' })).toHaveFocus())
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('trava a rolagem da página enquanto está aberto', () => {
    const { unmount } = render(<DialogoPedido titulo="Pedido #0101" onFechar={vi.fn()}><p>Itens</p></DialogoPedido>)

    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
