import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ToastProvider from './ToastProvider'
import useToast from './useToast'

let toastAtual

function Disparador() {
  const toast = useToast()
  useEffect(() => {
    toastAtual = toast
  }, [toast])
  return null
}

function renderizar() {
  return render(<ToastProvider><Disparador /></ToastProvider>)
}

function sucesso(mensagem) {
  act(() => toastAtual.sucesso(mensagem))
}

function erro(mensagem) {
  act(() => toastAtual.erro(mensagem))
}

function avancar(ms) {
  act(() => vi.advanceTimersByTime(ms))
}

function regiaoSucesso() {
  return within(screen.getByRole('status'))
}

function regiaoErro() {
  return within(screen.getByRole('alert'))
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mantém as duas regiões vivas montadas antes do primeiro aviso', () => {
    renderizar()
    const regiao = screen.getByRole('region', { name: 'Avisos' })

    expect(within(regiao).getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(within(regiao).getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('remove o aviso de sucesso após 5 segundos', () => {
    renderizar()

    sucesso('Cliente salvo.')
    expect(regiaoSucesso().getByText('Cliente salvo.')).toBeInTheDocument()

    avancar(4999)
    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()

    avancar(1)
    expect(screen.queryByText('Cliente salvo.')).not.toBeInTheDocument()
  })

  it('pausa o tempo com o mouse sobre o aviso', () => {
    renderizar()
    sucesso('Cliente salvo.')
    avancar(2000)

    fireEvent.mouseEnter(screen.getByText('Cliente salvo.').parentElement)
    avancar(60000)
    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByText('Cliente salvo.').parentElement)
    avancar(2999)
    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()

    avancar(1)
    expect(screen.queryByText('Cliente salvo.')).not.toBeInTheDocument()
  })

  it('pausa o tempo com o foco no aviso', () => {
    renderizar()
    sucesso('Cliente salvo.')
    avancar(1000)
    const botao = screen.getByRole('button', { name: 'Fechar aviso' })

    act(() => botao.focus())
    avancar(60000)
    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()

    act(() => botao.blur())
    avancar(3999)
    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()

    avancar(1)
    expect(screen.queryByText('Cliente salvo.')).not.toBeInTheDocument()
  })

  it('continua pausado se só o mouse ou só o foco sair', () => {
    renderizar()
    sucesso('Cliente salvo.')
    const botao = screen.getByRole('button', { name: 'Fechar aviso' })

    fireEvent.mouseEnter(botao.parentElement)
    act(() => botao.focus())
    fireEvent.mouseLeave(botao.parentElement)
    avancar(60000)

    expect(screen.getByText('Cliente salvo.')).toBeInTheDocument()
  })

  it('mantém o aviso de erro até ser fechado', () => {
    renderizar()

    erro('Falha ao salvar.')
    avancar(60000)
    expect(regiaoErro().getByText('Falha ao salvar.')).toBeInTheDocument()

    fireEvent.click(regiaoErro().getByRole('button', { name: 'Fechar aviso' }))
    expect(screen.queryByText('Falha ao salvar.')).not.toBeInTheDocument()
  })

  it('fecha o aviso pelo botão acessível por teclado', () => {
    renderizar()
    sucesso('Cliente salvo.')
    const botao = screen.getByRole('button', { name: 'Fechar aviso' })

    expect(botao.tagName).toBe('BUTTON')
    expect(botao).toHaveAttribute('type', 'button')
    act(() => botao.focus())
    expect(botao).toHaveFocus()
    // A native button turns Enter and Space into a click; jsdom only needs the click itself.
    fireEvent.click(botao)

    expect(screen.queryByText('Cliente salvo.')).not.toBeInTheDocument()
  })

  it('empilha avisos e respeita o limite', () => {
    renderizar()

    sucesso('Aviso 1')
    sucesso('Aviso 2')
    sucesso('Aviso 3')
    expect(screen.getAllByText(/^Aviso/).map((item) => item.textContent)).toEqual(['Aviso 1', 'Aviso 2', 'Aviso 3'])

    sucesso('Aviso 4')
    sucesso('Aviso 5')
    sucesso('Aviso 6')
    expect(screen.getAllByText(/^Aviso/).map((item) => item.textContent)).toEqual(['Aviso 2', 'Aviso 3', 'Aviso 4', 'Aviso 5', 'Aviso 6'])
  })

  it('leva o foco ao próximo aviso quando o aviso focado fecha', () => {
    renderizar()
    erro('Erro 1')
    erro('Erro 2')
    const [primeiro, segundo] = screen.getAllByRole('button', { name: 'Fechar aviso' })

    act(() => primeiro.focus())
    fireEvent.click(primeiro)

    expect(screen.queryByText('Erro 1')).not.toBeInTheDocument()
    expect(segundo).toHaveFocus()
  })

  it('leva o foco ao aviso seguinte quando o limite remove o aviso focado', () => {
    renderizar()
    erro('Erro 1')
    erro('Erro 2')
    const [primeiro, segundo] = screen.getAllByRole('button', { name: 'Fechar aviso' })
    act(() => primeiro.focus())

    erro('Erro 3')
    erro('Erro 4')
    erro('Erro 5')
    erro('Erro 6')

    expect(screen.queryByText('Erro 1')).not.toBeInTheDocument()
    expect(segundo).toHaveFocus()
  })

  it('não rouba o foco ao mostrar nem ao fechar um aviso não focado', () => {
    render(<ToastProvider><Disparador /><button type="button">Salvar</button></ToastProvider>)
    const salvar = screen.getByRole('button', { name: 'Salvar' })
    act(() => salvar.focus())

    erro('Erro 1')
    expect(salvar).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    expect(salvar).toHaveFocus()
  })

  it('mantém as mesmas funções entre renderizações', () => {
    renderizar()
    const inicial = toastAtual

    sucesso('Cliente salvo.')

    expect(toastAtual).toBe(inicial)
  })

  it('limpa os temporizadores ao desmontar', () => {
    const { unmount } = renderizar()
    sucesso('Cliente salvo.')
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('falha fora do provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Disparador />)).toThrow('useToast must be used within ToastProvider')

    consoleError.mockRestore()
  })
})
