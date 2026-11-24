import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import CancelarPedido from './CancelarPedido'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { post: vi.fn() } }))

const PEDIDO = { idPedido: 42, statusPedido: 'ESPERANDO_FAZER' }

function renderizar() {
  const props = { onFechar: vi.fn(), onCancelado: vi.fn() }
  render(<ToastProvider><CancelarPedido pedido={PEDIDO} {...props} /></ToastProvider>)
  return props
}

function preencher(tipoRetorno) {
  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'CLIENTE_DESISTIU' } })
  fireEvent.change(screen.getByLabelText('Retorno para a cliente'), { target: { value: tipoRetorno } })
}

function confirmar() {
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
  const confirmacao = screen.getByRole('dialog', { name: 'Cancelar o pedido #0042?' })
  fireEvent.click(within(confirmacao).getByRole('button', { name: 'Cancelar pedido' }))
}

describe('CancelarPedido', () => {
  afterEach(() => vi.clearAllMocks())

  it('envia o cancelamento', async () => {
    api.post.mockResolvedValue({ data: { idCancelamento: 5 } })
    const { onCancelado, onFechar } = renderizar()
    preencher('DEVOLUCAO')
    fireEvent.change(screen.getByLabelText('Valor devolvido (R$)'), { target: { value: '40' } })
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Cliente remarcou' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Cancelar o pedido #0042?' })).getByRole('button', { name: 'Cancelar pedido' }))

    await waitFor(() => expect(onCancelado).toHaveBeenCalledWith({ idPedido: 42, statusPedido: 'CANCELADO' }))
    expect(api.post).toHaveBeenCalledWith('/cancelamentos/pedido/42', {
      tipoCancelamento: 'CLIENTE_DESISTIU',
      tipoRetorno: 'DEVOLUCAO',
      valorRetorno: 40,
      observacao: 'Cliente remarcou',
    })
    expect(onFechar).toHaveBeenCalled()
  })

  it('sem devolução não envia valor', async () => {
    api.post.mockResolvedValue({ data: { idCancelamento: 5 } })
    renderizar()
    preencher('SEM_DEVOLUCAO')
    expect(screen.queryByLabelText('Valor devolvido (R$)')).not.toBeInTheDocument()
    confirmar()
    await waitFor(() => expect(api.post).toHaveBeenCalled())
    expect(api.post.mock.calls[0][1]).toEqual({ tipoCancelamento: 'CLIENTE_DESISTIU', tipoRetorno: 'SEM_DEVOLUCAO', valorRetorno: null, observacao: null })
  })

  it('exige valor na devolução', () => {
    renderizar()
    preencher('DEVOLUCAO')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    expect(screen.getByText('Informe o valor devolvido (zero ou mais).')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Cancelar o pedido #0042?' })).not.toBeInTheDocument()
  })

  it('mostra o 409 e mantém o formulário', async () => {
    api.post.mockRejectedValue({ response: { status: 409, data: {} } })
    const { onCancelado } = renderizar()
    preencher('SEM_DEVOLUCAO')
    confirmar()
    expect(await screen.findByText('O pedido mudou ou já foi cancelado. Atualize a tela.')).toBeInTheDocument()
    expect(onCancelado).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Motivo')).toHaveValue('CLIENTE_DESISTIU')
  })
})
