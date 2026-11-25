import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PaginacaoPedidos from './PaginacaoPedidos'

describe('PaginacaoPedidos', () => {
  it('some quando tudo cabe em uma página', () => {
    const { container } = render(<PaginacaoPedidos totalItens={6} porPagina={8} pagina={1} aoMudar={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('aparece quando há mais de uma página', () => {
    render(<PaginacaoPedidos totalItens={9} porPagina={8} pagina={1} aoMudar={vi.fn()} />)

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })
})
