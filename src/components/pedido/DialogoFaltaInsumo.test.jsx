import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import DialogoFaltaInsumo from './DialogoFaltaInsumo'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))

const FALTAS = [
  { insumoId: 7, nome: 'Chocolate meio amargo', necessario: 1.2, disponivel: 0.8, unidade: 'KG' },
  { insumoId: 12, nome: 'Leite condensado', necessario: 6, disponivel: 4, unidade: 'UNIDADE' },
]

function renderizar(ehDona, { onConfirmar = vi.fn(), onFechar = vi.fn() } = {}) {
  render(
    <DialogoFaltaInsumo
      aberto
      mensagem="Faltam insumos para confirmar o pedido."
      faltas={FALTAS}
      ehDona={ehDona}
      onConfirmarMesmoAssim={onConfirmar}
      onFechar={onFechar}
    />,
  )
}

describe('DialogoFaltaInsumo', () => {
  it('lista cada falta formatada', () => {
    renderizar(true)
    const dialogo = screen.getByRole('dialog', { name: 'Faltam insumos para este pedido' })
    expect(dialogo).toHaveTextContent('Faltam insumos para confirmar o pedido.')
    const linhas = within(dialogo).getAllByRole('listitem')
    expect(linhas[0]).toHaveTextContent('Chocolate meio amargo — necessário 1,2 kg, disponível 0,8 kg, faltam 0,4 kg')
    expect(linhas[1]).toHaveTextContent('Leite condensado — necessário 6 un., disponível 4 un., faltam 2 un.')
    expect(dialogo).toHaveTextContent('Se confirmar, o pedido fica marcado como confirmado com falta de insumo.')
  })

  it('DONA pode confirmar mesmo assim ou cancelar', () => {
    const onConfirmar = vi.fn()
    const onFechar = vi.fn()
    renderizar(true, { onConfirmar, onFechar })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mesmo assim' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('FUNCIONARIA vê só Fechar', () => {
    const onFechar = vi.fn()
    renderizar(false, { onFechar })
    expect(screen.queryByRole('button', { name: 'Confirmar mesmo assim' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('Só a dona pode confirmar um pedido com falta de insumo.')
    const fechar = screen.getByRole('button', { name: 'Fechar' })
    expect(fechar).toHaveFocus()
    fireEvent.keyDown(fechar, { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(1)
  })
})
