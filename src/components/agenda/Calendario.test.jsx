import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Calendario from './Calendario'
import { farolConfigurado } from './farolUtils'

function renderizar(farol) {
  return render(
    <Calendario pedidos={[]} farol={farol} mesExibido={new Date(2026, 10, 1)} dataSelecionada="2026-11-24"
      aoMudarMes={vi.fn()} aoIrParaHoje={vi.fn()} aoSelecionarData={vi.fn()} />,
  )
}

describe('Calendario - legenda do farol', () => {
  it('mostra os limites quando o farol está configurado', () => {
    const { container } = renderizar({ limiteVerde: 2, limiteAmarelo: 4, limiteVermelho: 6 })

    expect(container.querySelector('.calendar-footer')).toHaveTextContent('até 3 pedidos')
    expect(container.querySelector('.calendar-footer')).toHaveTextContent('6+ pedidos')
  })

  it('pede a configuração em vez de mostrar NaN quando faltam limites', () => {
    const { container } = renderizar([])

    expect(container.querySelector('.calendar-footer')).not.toHaveTextContent('NaN')
    expect(screen.getByText(/configure os limites/i)).toBeInTheDocument()
  })

  it('reconhece só farol com limites', () => {
    expect(farolConfigurado(null)).toBe(false)
    expect(farolConfigurado({})).toBe(false)
    expect(farolConfigurado({ limiteAmarelo: 3, limiteVermelho: 5 })).toBe(true)
  })
})
