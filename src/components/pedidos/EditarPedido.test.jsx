import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import EditarPedido from './EditarPedido'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { put: vi.fn() } }))

const PEDIDO = {
  idPedido: 42,
  clienteId: 3,
  tipoPedido: 'PEDIDO_CONFIRMADO',
  statusPedido: 'ESPERANDO_FAZER',
  formaEntrega: 'ENTREGA',
  enderecoEntrega: 'Rua Exemplo, 100',
  cep: '01001000',
  dataEntrega: '2026-11-20',
  anotacao: 'Sem lactose',
}
const CLIENTES = [{ idCliente: 3, nome: 'Cliente Exemplo' }, { idCliente: 4, nome: 'Cliente Teste' }]

function renderizar() {
  const props = { onFechar: vi.fn(), onPedidoAtualizado: vi.fn() }
  render(<ToastProvider><EditarPedido pedido={PEDIDO} clientes={CLIENTES} {...props} /></ToastProvider>)
  return props
}

describe('EditarPedido', () => {
  afterEach(() => vi.clearAllMocks())

  it('envia PUT com a fase atual', async () => {
    api.put.mockResolvedValue({ data: { ...PEDIDO, dataEntrega: '2026-11-21' } })
    const { onFechar, onPedidoAtualizado } = renderizar()

    fireEvent.change(screen.getByLabelText('Data de entrega'), { target: { value: '2026-11-21' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(onPedidoAtualizado).toHaveBeenCalledWith({ ...PEDIDO, dataEntrega: '2026-11-21' }))
    expect(api.put).toHaveBeenCalledWith('/pedidos/42', {
      clienteId: 3,
      tipoPedido: 'PEDIDO_CONFIRMADO',
      statusPedido: 'ESPERANDO_FAZER',
      formaEntrega: 'ENTREGA',
      enderecoEntrega: 'Rua Exemplo, 100',
      cep: '01001000',
      dataEntrega: '2026-11-21',
      anotacao: 'Sem lactose',
    })
    expect(onFechar).toHaveBeenCalled()
    expect(await screen.findByText('Pedido #0042 atualizado.')).toBeInTheDocument()
  })

  it('mantém o formulário no erro', async () => {
    api.put.mockRejectedValue({ response: { status: 400, data: { message: 'Data de entrega deve ser hoje ou uma data futura' } } })
    const { onFechar } = renderizar()

    fireEvent.change(screen.getByLabelText('Data de entrega'), { target: { value: '2020-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Data de entrega deve ser hoje ou uma data futura')).toBeInTheDocument()
    expect(onFechar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Data de entrega')).toHaveValue('2020-01-01')
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).not.toBeDisabled()
  })

  it('exige endereço quando a forma é entrega', () => {
    renderizar()
    fireEvent.change(screen.getByLabelText('Endereço de entrega'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(screen.getByText('Informe o endereço de entrega.')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('retirada envia endereço e CEP nulos', async () => {
    api.put.mockResolvedValue({ data: PEDIDO })
    renderizar()
    fireEvent.change(screen.getByLabelText('Forma de entrega'), { target: { value: 'RETIRADA' } })
    expect(screen.queryByLabelText('Endereço de entrega')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(api.put).toHaveBeenCalled())
    expect(api.put.mock.calls[0][1]).toMatchObject({ formaEntrega: 'RETIRADA', enderecoEntrega: null, cep: null })
  })
})
