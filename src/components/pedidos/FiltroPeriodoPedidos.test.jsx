import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FiltroPeriodoPedidos from './FiltroPeriodoPedidos'
import { STATUS_AGENDA } from './filtrosUtils'

const FILTRO = { de: '2026-11-16', ate: '2026-11-23', status: [] }
const ETAPAS = [['EM_PRODUCAO', 'Em produção'], ['AGUARDANDO_ENTREGA', 'Aguardando entrega']]

function renderizar(props = {}) {
  const onAplicar = vi.fn()
  const onRestaurar = vi.fn()
  render(<FiltroPeriodoPedidos filtro={FILTRO} onAplicar={onAplicar} onRestaurar={onRestaurar} {...props} />)
  return { onAplicar, onRestaurar }
}

function preencher(de, ate) {
  fireEvent.change(screen.getByLabelText('De'), { target: { value: de } })
  fireEvent.change(screen.getByLabelText('Até'), { target: { value: ate } })
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
}

describe('FiltroPeriodoPedidos', () => {
  it('campos com rótulo', () => {
    const { onRestaurar } = renderizar({ opcoesStatus: ETAPAS })
    expect(screen.getByRole('form', { name: 'Filtrar pedidos por período' })).toBeInTheDocument()
    expect(screen.getByLabelText('De')).toHaveValue('2026-11-16')
    expect(screen.getByLabelText('Até')).toHaveValue('2026-11-23')
    expect(screen.getByRole('group', { name: 'Etapas' })).toBeInTheDocument()
    expect(screen.getByLabelText('Em produção')).toBeInTheDocument()
    expect(screen.getByText('Mostrando entregas de 16/11/2026 a 23/11/2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }))
    expect(onRestaurar).toHaveBeenCalled()
  })

  it('aplica um período válido', () => {
    const { onAplicar } = renderizar()
    preencher('2026-01-01', '2026-12-31')
    expect(onAplicar).toHaveBeenCalledWith({ de: '2026-01-01', ate: '2026-12-31', status: [] })
  })

  it('recusa período acima de 366 dias', () => {
    const { onAplicar } = renderizar()
    preencher('2025-01-01', '2026-11-16')
    expect(screen.getByRole('alert')).toHaveTextContent('O período pode ter no máximo 366 dias.')
    expect(screen.getByLabelText('De')).toHaveAttribute('aria-describedby', screen.getByRole('alert').id)
    expect(onAplicar).not.toHaveBeenCalled()
  })

  it('recusa de depois de ate', () => {
    const { onAplicar } = renderizar()
    preencher('2026-11-20', '2026-11-16')
    expect(screen.getByRole('alert')).toHaveTextContent('A data inicial deve ser igual ou anterior à data final.')
    expect(onAplicar).not.toHaveBeenCalled()
  })

  it('exige as duas datas', () => {
    const { onAplicar } = renderizar()
    preencher('', '2026-11-16')
    expect(screen.getByRole('alert')).toHaveTextContent('Informe as duas datas do período.')
    expect(onAplicar).not.toHaveBeenCalled()
  })

  it('exige ao menos uma etapa', () => {
    const { onAplicar } = renderizar({ filtro: { ...FILTRO, status: ['EM_PRODUCAO'] }, opcoesStatus: ETAPAS, exigeStatus: true })
    fireEvent.click(screen.getByLabelText('Em produção'))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione ao menos uma etapa.')
    expect(onAplicar).not.toHaveBeenCalled()
  })

  it('incluir cancelados alterna entre todas as etapas e as sem cancelado', () => {
    const { onAplicar } = renderizar({ filtro: { ...FILTRO, status: STATUS_AGENDA }, opcaoCancelados: true })
    const caixa = screen.getByLabelText('Incluir cancelados')
    expect(caixa).not.toBeChecked()
    fireEvent.click(caixa)
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onAplicar).toHaveBeenCalledWith({ ...FILTRO, status: [] })
  })

  it('desabilita aplicar durante a carga', () => {
    renderizar({ carregando: true })
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
  })
})
