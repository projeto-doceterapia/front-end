import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VisaoGeral from './VisaoGeral'
import api from '../../services/api'
import useSessao from '../../components/sessao/useSessao'

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

async function abrir(perfil) {
  useSessao.mockReturnValue({ perfil, ehDona: perfil === 'DONA' })
  render(<VisaoGeral />)
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/configuracao-farol'))
}

describe('VisaoGeral por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('mostra lucro, custo, margem e o gráfico de faturamento para a DONA', async () => {
    await abrir('DONA')

    expect(screen.getByText('Lucro', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Custo total')).toBeInTheDocument()
    expect(screen.getByText('Margem de lucro')).toBeInTheDocument()
    expect(screen.getByText('Faturamento mensal x custo x lucro')).toBeInTheDocument()
  })

  it('oculta os valores financeiros para a FUNCIONARIA e mantém a parte operacional', async () => {
    await abrir('FUNCIONARIA')

    expect(screen.queryByText('Lucro', { selector: 'p' })).not.toBeInTheDocument()
    expect(screen.queryByText('Custo total')).not.toBeInTheDocument()
    expect(screen.queryByText('Margem de lucro')).not.toBeInTheDocument()
    expect(screen.queryByText('Faturamento mensal x custo x lucro')).not.toBeInTheDocument()
    expect(screen.getByText('Dias lotados')).toBeInTheDocument()
  })
})
