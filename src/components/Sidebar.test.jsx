import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import estilos from '../index.css?raw'
import Sidebar from './Sidebar'

function itensPrincipais() {
  const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
  return [...nav.querySelectorAll('.sidebar-item')]
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('ordem do fluxo', () => {
    render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)

    expect(itensPrincipais().map((item) => item.textContent)).toEqual([
      'Visão Geral', 'Agenda', 'Produção', 'Clientes', 'Pedidos', 'Produtos', 'Estoque',
    ])
    const submenu = screen.getByRole('navigation').querySelector('.sidebar-submenu')
    expect(within(submenu).getAllByRole('button').map((botao) => botao.textContent)).toEqual([
      'Registrar Pedido', 'Histórico',
    ])
  })

  it('todo item tem nome acessível', () => {
    render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)

    for (const botao of within(screen.getByRole('navigation')).getAllByRole('button')) {
      expect(botao.textContent.trim()).not.toBe('')
      expect(botao).toHaveAccessibleName(botao.textContent.trim())
    }
    expect(estilos).not.toMatch(/\.sidebar-rotulo[^{]*\{[^}]*display:\s*none/)
  })

  it('navega para Produção como item próprio e marca a página atual', () => {
    const aoNavegar = vi.fn()
    render(<Sidebar telaAtual="producao" aoNavegar={aoNavegar} />)

    const producao = screen.getByRole('button', { name: 'Produção' })
    expect(producao).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Pedidos' })).not.toHaveAttribute('aria-current')

    fireEvent.click(producao)
    expect(aoNavegar).toHaveBeenCalledWith('producao')
  })

  it('marca Pedidos quando o histórico está aberto', () => {
    render(<Sidebar telaAtual="historico-pedidos" aoNavegar={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Histórico' })).toHaveAttribute('aria-current', 'page')
  })

  describe('menu recolhível', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('recolhe e expande pelo botão com estado anunciado', () => {
      const { container } = render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)
      const alternar = screen.getByRole('button', { name: 'Recolher menu' })
      expect(alternar).toHaveAttribute('aria-expanded', 'true')
      expect(alternar).toHaveAttribute('aria-controls', 'sidebar-nav')

      fireEvent.click(alternar)

      const expandir = screen.getByRole('button', { name: 'Expandir menu' })
      expect(expandir).toHaveAttribute('aria-expanded', 'false')
      expect(container.querySelector('.sidebar')).toHaveClass('recolhida')
      expect(screen.getByRole('button', { name: 'Agenda' })).toHaveAttribute('title', 'Agenda')

      fireEvent.click(expandir)
      expect(container.querySelector('.sidebar')).not.toHaveClass('recolhida')
    })

    it('lembra a preferência neste navegador', () => {
      const { unmount } = render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))
      unmount()

      render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
    })

    it('funciona sem armazenamento disponível', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
      render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))

      expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
      vi.restoreAllMocks()
    })

    it('começa compacto em tela média, expande sem mudar a preferência salva', () => {
      vi.stubGlobal('matchMedia', (consulta) => ({ matches: consulta.includes('1023'), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
      const { container } = render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)
      expect(container.querySelector('.sidebar')).toHaveClass('recolhida')

      fireEvent.click(screen.getByRole('button', { name: 'Expandir menu' }))

      expect(container.querySelector('.sidebar')).not.toHaveClass('recolhida')
      expect(screen.getByRole('button', { name: 'Recolher menu' })).toHaveAttribute('aria-expanded', 'true')
      expect(localStorage.getItem('doceterapia-menu-recolhido')).toBeNull()
    })

    it('fica sempre compacto e sem botão em tela estreita', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
      const { container } = render(<Sidebar telaAtual="agenda" aoNavegar={vi.fn()} />)

      expect(container.querySelector('.sidebar')).toHaveClass('recolhida')
      expect(screen.queryByRole('button', { name: /menu$/ })).not.toBeInTheDocument()
    })
  })
})
