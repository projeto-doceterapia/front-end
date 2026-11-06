import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ConfirmDialog from './ConfirmDialog'

function Exemplo({ onCancel = () => {}, onConfirm = () => {}, ...props }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>Excluir</button>
      <ConfirmDialog
        aberto={aberto}
        titulo="Excluir insumo?"
        mensagem="Essa ação não tem volta."
        onConfirm={() => { onConfirm(); setAberto(false) }}
        onCancel={() => { onCancel(); setAberto(false) }}
        {...props}
      />
    </>
  )
}

function abrir() {
  const origem = screen.getByRole('button', { name: 'Excluir' })
  act(() => origem.focus())
  fireEvent.click(origem)
  return origem
}

function botao(nome) {
  return screen.getByRole('button', { name: nome })
}

describe('ConfirmDialog', () => {
  it('não renderiza nada fechado', () => {
    render(<ConfirmDialog aberto={false} titulo="Título" mensagem="Mensagem" onConfirm={() => {}} onCancel={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('expõe diálogo modal rotulado pelo título', () => {
    render(<Exemplo />)
    abrir()
    const dialogo = screen.getByRole('dialog', { name: 'Excluir insumo?' })

    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveAccessibleDescription('Essa ação não tem volta.')
  })

  it('aceita um nó React como mensagem e textos próprios nos botões', () => {
    render(
      <Exemplo
        mensagem={<ul><li>Faltam 2 kg de farinha</li></ul>}
        textoConfirmar="Confirmar com falta"
        textoCancelar="Voltar"
      />,
    )
    abrir()

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Faltam 2 kg de farinha')
    expect(botao('Confirmar com falta')).toBeInTheDocument()
    expect(botao('Voltar')).toBeInTheDocument()
  })

  it('usa os textos padrão e chama onConfirm', () => {
    const onConfirm = vi.fn()
    render(<Exemplo onConfirm={onConfirm} />)
    abrir()

    expect(botao('Cancelar')).toBeInTheDocument()
    fireEvent.click(botao('Confirmar'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('prende o foco dentro do diálogo', () => {
    render(<Exemplo />)
    abrir()
    const dialogo = screen.getByRole('dialog')
    const cancelar = botao('Cancelar')
    const confirmar = botao('Confirmar')

    expect(confirmar).toHaveFocus()
    fireEvent.keyDown(dialogo, { key: 'Tab' })
    expect(cancelar).toHaveFocus()

    fireEvent.keyDown(dialogo, { key: 'Tab', shiftKey: true })
    expect(confirmar).toHaveFocus()
  })

  it('não interfere no Tab fora das pontas', () => {
    render(<Exemplo />)
    abrir()
    act(() => botao('Cancelar').focus())

    // fireEvent returns false when preventDefault was called.
    expect(fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })).toBe(true)
    expect(botao('Cancelar')).toHaveFocus()
  })

  it('Esc chama onCancel', () => {
    const onCancel = vi.fn()
    const noPai = vi.fn()
    render(<div onKeyDown={noPai}><Exemplo onCancel={onCancel} /></div>)
    abrir()

    const seguiuPadrao = fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(noPai).not.toHaveBeenCalled()
    expect(seguiuPadrao).toBe(false)
  })

  it('cancela no botão e no clique no fundo, não dentro do diálogo', () => {
    const onCancel = vi.fn()
    render(<Exemplo onCancel={onCancel} />)

    abrir()
    fireEvent.click(botao('Cancelar'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    abrir()
    const dialogo = screen.getByRole('dialog')
    fireEvent.click(dialogo)
    expect(onCancel).toHaveBeenCalledTimes(1)

    fireEvent.click(dialogo.parentElement)
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('devolve o foco ao elemento de origem', () => {
    render(<Exemplo />)
    const origem = abrir()
    expect(origem).not.toHaveFocus()

    fireEvent.click(botao('Cancelar'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(origem).toHaveFocus()
  })

  it('não falha se o elemento de origem saiu do documento', () => {
    function ExemploOrigemRemovida() {
      const [aberto, setAberto] = useState(false)
      const [origem, setOrigem] = useState(true)
      return (
        <>
          {origem && <button type="button" onClick={() => setAberto(true)}>Excluir</button>}
          <ConfirmDialog
            aberto={aberto}
            titulo="Título"
            mensagem="Mensagem"
            onConfirm={() => { setOrigem(false); setAberto(false) }}
            onCancel={() => {}}
          />
        </>
      )
    }
    render(<ExemploOrigemRemovida />)
    abrir()

    fireEvent.click(botao('Confirmar'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body).toHaveFocus()
  })

  it('foco inicial seguro quando perigoso', () => {
    const { unmount } = render(<Exemplo perigoso />)
    abrir()
    expect(botao('Cancelar')).toHaveFocus()
    expect(botao('Confirmar')).toHaveClass('confirm-perigo')
    unmount()

    render(<Exemplo />)
    abrir()
    expect(botao('Confirmar')).toHaveFocus()
    expect(botao('Confirmar')).not.toHaveClass('confirm-perigo')
  })

  it('trava a rolagem do body enquanto aberto e restaura o valor anterior', () => {
    document.body.style.overflow = 'scroll'
    render(<Exemplo />)

    abrir()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(botao('Cancelar'))
    expect(document.body.style.overflow).toBe('scroll')
    document.body.style.overflow = ''
  })

  it('bloqueia botões, Esc e fundo enquanto ocupado, mantendo o foco no diálogo', () => {
    const onCancel = vi.fn()
    const noPai = vi.fn()
    const props = { aberto: true, titulo: 'Título', mensagem: 'Mensagem', onConfirm: () => {}, onCancel }
    const { rerender } = render(<div onKeyDown={noPai}><ConfirmDialog {...props} /></div>)
    expect(botao('Confirmar')).toHaveFocus()

    rerender(<div onKeyDown={noPai}><ConfirmDialog {...props} ocupado /></div>)
    const dialogo = screen.getByRole('dialog')
    expect(botao('Confirmar')).toBeDisabled()
    expect(botao('Cancelar')).toBeDisabled()
    expect(dialogo).toHaveFocus()

    expect(fireEvent.keyDown(dialogo, { key: 'Tab' })).toBe(false)
    noPai.mockClear()
    fireEvent.keyDown(dialogo, { key: 'Escape' })
    fireEvent.click(dialogo.parentElement)
    expect(onCancel).not.toHaveBeenCalled()
    expect(noPai).not.toHaveBeenCalled()

    rerender(<div onKeyDown={noPai}><ConfirmDialog {...props} /></div>)
    expect(botao('Confirmar')).toHaveFocus()
  })
})
