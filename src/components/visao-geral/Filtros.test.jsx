import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Filtros from './Filtros'

describe('Filtros', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 18, 10, 0) })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marca o atalho do período atual como pressionado', () => {
    render(<Filtros de="2026-11-01" ate="2026-11-30" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Este mês' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mês passado' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('escolher Mês passado devolve o novo período', () => {
    const onChange = vi.fn()
    render(<Filtros de="2026-11-01" ate="2026-11-30" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Mês passado' }))

    expect(onChange).toHaveBeenCalledWith({ de: '2026-10-01', ate: '2026-10-31' })
    expect(screen.getByRole('button', { name: 'Mês passado' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('datas dentro de 366 dias chamam onChange', () => {
    const onChange = vi.fn()
    render(<Filtros de="2026-11-01" ate="2026-11-30" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-06-01' } })

    expect(onChange).toHaveBeenCalledWith({ de: '2026-06-01', ate: '2026-11-30' })
  })

  it('acima de 366 dias mostra o aviso acessível e não chama onChange', () => {
    const onChange = vi.fn()
    render(<Filtros de="2026-11-01" ate="2026-11-30" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2025-01-01' } })

    expect(screen.getByRole('alert')).toHaveTextContent('O período máximo é de 366 dias')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('data limpa não chama onChange nem mostra aviso', () => {
    const onChange = vi.fn()
    render(<Filtros de="2026-11-01" ate="2026-11-30" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
