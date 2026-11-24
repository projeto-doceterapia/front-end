import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { dinheiro } from '../pedidos/pedidoUtils'
import Pagamento from './Pagamento'

describe('Pagamento', () => {
  it('mostra os valores previstos sem forma de pagamento', () => {
    render(<Pagamento total={250.01} dinheiro={dinheiro} dados={{ anotacao: '' }} aoAlterar={() => {}} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Sinal previsto (50%)')).toHaveTextContent('R$ 125,01')
    expect(screen.getByText('Restante previsto')).toHaveTextContent('R$ 125,00')
  })
})
