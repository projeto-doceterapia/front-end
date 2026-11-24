import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import estilos from '../index.css?raw'
import Sidebar from './Sidebar'

function itensPrincipais() {
  const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
  return [...nav.querySelectorAll('.sidebar-item')]
}

describe('Sidebar', () => {
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
})
