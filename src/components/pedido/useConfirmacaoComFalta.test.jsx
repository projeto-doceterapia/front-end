import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import useSessao from '../sessao/useSessao'
import api from '../../services/api'
import { avancarStatus } from '../../services/pedidos'
import useConfirmacaoComFalta from './useConfirmacaoComFalta'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))
vi.mock('../../services/api', () => ({ default: { patch: vi.fn() } }))

const FALTAS = [{ insumoId: 7, nome: 'Chocolate meio amargo', necessario: 1.2, disponivel: 0.8, unidade: 'KG' }]
const ERRO_FALTA = { response: { status: 422, data: { message: 'Faltam insumos para confirmar o pedido.', faltas: FALTAS } } }
const CONFIRMADO = { idPedido: 42, statusPedido: 'AGUARDANDO_SINAL', confirmadoComFaltaInsumo: true }

function Harness({ onResultado, onErro }) {
  const { executar, dialogo } = useConfirmacaoComFalta()
  function confirmar() {
    executar((comFalta) => avancarStatus(42, 'AGUARDANDO_SINAL', comFalta)).then(onResultado, onErro)
  }
  return (
    <>
      <button type="button" onClick={confirmar}>Confirmar pedido</button>
      {dialogo}
    </>
  )
}

function renderizar(ehDona = true) {
  useSessao.mockReturnValue({ ehDona })
  const onResultado = vi.fn()
  const onErro = vi.fn()
  render(<ToastProvider><Harness onResultado={onResultado} onErro={onErro} /></ToastProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
  return { onResultado, onErro }
}

describe('useConfirmacaoComFalta', () => {
  afterEach(() => vi.clearAllMocks())

  it('sem falta resolve com a resposta e não envia o parâmetro', async () => {
    api.patch.mockResolvedValue({ data: { idPedido: 42, statusPedido: 'AGUARDANDO_SINAL' } })
    const { onResultado } = renderizar()
    await waitFor(() => expect(onResultado).toHaveBeenCalledWith({ cancelado: false, comFalta: false, dados: { idPedido: 42, statusPedido: 'AGUARDANDO_SINAL' } }))
    expect(api.patch).toHaveBeenCalledWith('/pedidos/42/status', null, { params: { statusPedido: 'AGUARDANDO_SINAL' } })
  })

  it('DONA repete a chamada com confirmarComFalta', async () => {
    api.patch.mockRejectedValueOnce(ERRO_FALTA).mockResolvedValueOnce({ data: CONFIRMADO })
    const { onResultado } = renderizar(true)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar mesmo assim' }))
    await waitFor(() => expect(onResultado).toHaveBeenCalledWith({ cancelado: false, comFalta: true, dados: CONFIRMADO }))
    expect(api.patch).toHaveBeenCalledTimes(2)
    expect(api.patch).toHaveBeenLastCalledWith('/pedidos/42/status', null, { params: { statusPedido: 'AGUARDANDO_SINAL', confirmarComFalta: true } })
    expect(await screen.findByText('Pedido confirmado com falta de insumo.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fechar não repete a chamada', async () => {
    api.patch.mockRejectedValueOnce(ERRO_FALTA)
    const { onResultado } = renderizar(false)
    fireEvent.click(await screen.findByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(onResultado).toHaveBeenCalledWith({ cancelado: true }))
    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('403 mostra toast de erro', async () => {
    const proibido = { response: { status: 403, data: { message: 'Só a dona pode confirmar pedido com falta de insumo.' } } }
    api.patch.mockRejectedValueOnce(ERRO_FALTA).mockRejectedValueOnce(proibido)
    const { onResultado } = renderizar(true)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar mesmo assim' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Só a dona pode confirmar pedido com falta de insumo.')
    expect(onResultado).toHaveBeenCalledWith({ cancelado: true })
  })

  it('erro sem faltas é repassado', async () => {
    const regra = { response: { status: 422, data: { message: 'Pedido sem itens.' } } }
    api.patch.mockRejectedValueOnce(regra)
    const { onResultado, onErro } = renderizar(true)
    await waitFor(() => expect(onErro).toHaveBeenCalledWith(regra))
    expect(onResultado).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
