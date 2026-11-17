import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import AcaoAvancarFase from './AcaoAvancarFase'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn(), put: vi.fn(), post: vi.fn() } }))

function renderizar(statusPedido, onPedidoAtualizado = vi.fn()) {
  render(
    <ToastProvider>
      <AcaoAvancarFase pedido={{ idPedido: 42, statusPedido }} onPedidoAtualizado={onPedidoAtualizado} />
    </ToastProvider>,
  )
  return onPedidoAtualizado
}

describe('AcaoAvancarFase', () => {
  afterEach(() => vi.clearAllMocks())

  it('avança direto sem confirmação', async () => {
    api.patch.mockResolvedValue({ data: { idPedido: 42, statusPedido: 'AGUARDANDO_ENTREGA' } })
    const onPedidoAtualizado = renderizar('EM_PRODUCAO')

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pronto' }))

    await waitFor(() => expect(onPedidoAtualizado).toHaveBeenCalledWith({ idPedido: 42, statusPedido: 'AGUARDANDO_ENTREGA' }))
    expect(api.patch).toHaveBeenCalledWith('/pedidos/42/status', null, { params: { statusPedido: 'AGUARDANDO_ENTREGA' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('Pedido #0042 agora está em Aguardando entrega.')).toBeInTheDocument()
  })

  it('pede confirmação ao iniciar produção e ao entregar', async () => {
    api.patch.mockResolvedValue({ data: { idPedido: 42, statusPedido: 'EM_PRODUCAO' } })
    renderizar('ESPERANDO_FAZER')

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar produção' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('a baixa não é desfeita')
    expect(api.patch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar produção' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar produção' })[1])
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1))
  })

  it('pede confirmação ao entregar', () => {
    renderizar('AGUARDANDO_ENTREGA')
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como entregue' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('não pode mais mudar de fase')
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('sem botão nas fases finais e aguardando sinal', () => {
    renderizar('ENTREGUE')
    renderizar('CANCELADO')
    renderizar('AGUARDANDO_SINAL')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('mostra o erro da API', async () => {
    api.patch.mockRejectedValue({ response: { status: 422, data: { message: 'Insumos insuficientes para confirmar o pedido' } } })
    const onPedidoAtualizado = renderizar('ORCAMENTO')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByText('Insumos insuficientes para confirmar o pedido')).toBeInTheDocument()
    expect(onPedidoAtualizado).not.toHaveBeenCalled()
  })

  it('não envia duas vezes', async () => {
    let responder
    api.patch.mockReturnValue(new Promise((resolve) => { responder = resolve }))
    renderizar('EM_PRODUCAO')
    const botao = screen.getByRole('button', { name: 'Marcar como pronto' })

    fireEvent.click(botao)
    fireEvent.click(botao)

    expect(botao).toBeDisabled()
    expect(api.patch).toHaveBeenCalledTimes(1)
    responder({ data: { idPedido: 42, statusPedido: 'AGUARDANDO_ENTREGA' } })
    await waitFor(() => expect(botao).not.toBeDisabled())
  })
})
