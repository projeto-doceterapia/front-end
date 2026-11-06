import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ResumoAgenda from './ResumoAgenda'
import useSessao from '../sessao/useSessao'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))

const PEDIDOS = [
  { idPedido: 1, statusPedido: 'AGUARDANDO_SINAL' },
  { idPedido: 2, statusPedido: 'EM_PRODUCAO' },
]

describe('ResumoAgenda por perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra Configurar farol para a DONA', () => {
    useSessao.mockReturnValue({ perfil: 'DONA', ehDona: true })
    const aoConfigurarFarol = vi.fn()
    render(<ResumoAgenda pedidos={PEDIDOS} aoConfigurarFarol={aoConfigurarFarol} />)

    fireEvent.click(screen.getByRole('button', { name: /Configurar farol/ }))
    expect(aoConfigurarFarol).toHaveBeenCalled()
  })

  it('oculta Configurar farol para a FUNCIONARIA e mantém os números', () => {
    useSessao.mockReturnValue({ perfil: 'FUNCIONARIA', ehDona: false })
    render(<ResumoAgenda pedidos={PEDIDOS} aoConfigurarFarol={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Configurar farol/ })).not.toBeInTheDocument()
    expect(screen.getByText('Pedidos cadastrados')).toBeInTheDocument()
  })
})
