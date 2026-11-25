import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EtapasPedido from './EtapasPedido'

describe('EtapasPedido', () => {
  it('marca a etapa atual na lista completa', () => {
    render(<EtapasPedido etapa={2} />)

    const etapas = screen.getAllByRole('listitem')
    expect(etapas).toHaveLength(3)
    expect(etapas[1]).toHaveAttribute('aria-current', 'step')
    expect(etapas[0]).not.toHaveAttribute('aria-current')
  })

  it('resume a etapa atual para telas estreitas', () => {
    render(<EtapasPedido etapa={1} />)

    expect(screen.getByText('Etapa 1 de 3 · Cliente e entrega')).toHaveClass('steps-compact')
  })
})
