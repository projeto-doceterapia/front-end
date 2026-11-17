import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ToastProvider from '../feedback/ToastProvider'
import useSessao from '../sessao/useSessao'
import api from '../../services/api'
import EditarItensPedido from './EditarItensPedido'

vi.mock('../sessao/useSessao', () => ({ default: vi.fn() }))
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

const PEDIDO = { idPedido: 42, statusPedido: 'AGUARDANDO_SINAL' }
const ITENS = [
  { idProdutoPedido: 1, fkPedido: 42, fkProduto: 9, quantidade: 1, valorUnitario: 40, observacao: null },
  { idProdutoPedido: 2, fkPedido: 42, fkProduto: 10, quantidade: 2, valorUnitario: 10, observacao: null },
]
const PRODUTOS = [
  { idProduto: 9, nome: 'Bolo de cenoura', precoAtual: 40 },
  { idProduto: 10, nome: 'Brigadeiro', precoAtual: 10 },
  { idProduto: 11, nome: 'Torta de limão', precoAtual: 60 },
]
const FALTAS = [{ insumoId: 7, nome: 'Chocolate meio amargo', necessario: 1.2, disponivel: 0.8, unidade: 'KG' }]
const ERRO_FALTA = { response: { status: 422, data: { message: 'Faltam insumos para alterar os itens do pedido.', faltas: FALTAS } } }

function renderizar(ehDona = true) {
  useSessao.mockReturnValue({ ehDona })
  const props = { onFechar: vi.fn(), onItensSalvos: vi.fn(), onPedidoAtualizado: vi.fn() }
  render(
    <ToastProvider>
      <EditarItensPedido pedido={PEDIDO} itens={ITENS} produtos={PRODUTOS} {...props} />
    </ToastProvider>,
  )
  return props
}

function editar() {
  fireEvent.change(screen.getByLabelText('Quantidade de Bolo de cenoura'), { target: { value: '3' } })
  fireEvent.click(screen.getByRole('button', { name: 'Remover Brigadeiro' }))
  fireEvent.change(screen.getByLabelText('Adicionar produto'), { target: { value: '11' } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar itens' }))
}

describe('EditarItensPedido', () => {
  afterEach(() => vi.clearAllMocks())

  it('edição de itens em sequência com override', async () => {
    api.delete.mockResolvedValue({})
    api.put.mockRejectedValueOnce(ERRO_FALTA).mockResolvedValueOnce({ data: { ...ITENS[0], quantidade: 3 } })
    api.post.mockResolvedValue({ data: { idProdutoPedido: 3, fkPedido: 42, fkProduto: 11, quantidade: 1, semFichaTecnica: true } })
    api.get.mockResolvedValue({ data: { ...PEDIDO, confirmadoComFaltaInsumo: true } })
    const props = renderizar(true)

    editar()
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar mesmo assim' }))

    await waitFor(() => expect(props.onFechar).toHaveBeenCalled())
    expect(api.delete).toHaveBeenCalledWith('/itens-pedido/2')
    const corpo = { fkProduto: 9, fkPedido: 42, quantidade: 3, valorUnitario: 40, observacao: null }
    expect(api.put).toHaveBeenNthCalledWith(1, '/itens-pedido/1', corpo, undefined)
    expect(api.put).toHaveBeenNthCalledWith(2, '/itens-pedido/1', corpo, { params: { confirmarComFalta: true } })
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/itens-pedido', { fkProduto: 11, fkPedido: 42, quantidade: 1, valorUnitario: 60, observacao: null }, { params: { confirmarComFalta: true } })
    expect(api.delete.mock.invocationCallOrder[0]).toBeLessThan(api.put.mock.invocationCallOrder[0])
    expect(props.onItensSalvos).toHaveBeenCalledWith([
      { ...ITENS[0], quantidade: 3 },
      { idProdutoPedido: 3, fkPedido: 42, fkProduto: 11, quantidade: 1, semFichaTecnica: true },
    ])
    expect(props.onPedidoAtualizado).toHaveBeenCalledWith({ ...PEDIDO, confirmadoComFaltaInsumo: true })
    expect(await screen.findByText('Itens do pedido #0042 salvos. 1 item sem ficha técnica: estoque não verificado.')).toBeInTheDocument()
  })

  it('fechar o diálogo para o salvamento e avisa os itens não salvos', async () => {
    api.delete.mockResolvedValue({})
    api.put.mockRejectedValueOnce(ERRO_FALTA)
    api.get.mockResolvedValue({ data: PEDIDO })
    const props = renderizar(false)

    editar()
    const falta = await screen.findByRole('dialog', { name: 'Faltam insumos para este pedido' })
    fireEvent.click(within(falta).getByRole('button', { name: 'Fechar' }))

    expect(await screen.findByText('Itens não salvos: Bolo de cenoura, Torta de limão.')).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalled()
    expect(props.onItensSalvos).toHaveBeenCalledWith([ITENS[0]])
    expect(props.onFechar).not.toHaveBeenCalled()
  })

  it('exige quantidade maior que zero', () => {
    renderizar()
    fireEvent.change(screen.getByLabelText('Quantidade de Bolo de cenoura'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar itens' }))
    expect(screen.getByText('Informe uma quantidade maior que zero em cada item.')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })
})
