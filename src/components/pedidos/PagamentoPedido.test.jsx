import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '../../services/api'
import renderComToast from '../../test/renderComToast'
import PagamentoPedido from './PagamentoPedido'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))

const PENDENTE = {
  idPagamento: 9,
  pedidoId: 42,
  valorTotal: 250,
  valorSinal: 125,
  valorRestante: 125,
  formaPagamentoSinal: null,
  formaPagamentoRestante: null,
  statusPagamento: 'AGUARDANDO_SINAL',
  dataPagamentoSinal: null,
  dataPagamentoRestante: null,
}
const SINAL_PAGO = { ...PENDENTE, formaPagamentoSinal: 'PIX', dataPagamentoSinal: '2026-11-10', statusPagamento: 'AGUARDANDO_PAGAMENTO' }
const QUITADO = { ...SINAL_PAGO, formaPagamentoRestante: 'DINHEIRO', dataPagamentoRestante: '2026-11-12', statusPagamento: 'PAGO_INTEGRAL' }

function renderizar(statusPedido, pagamento, onPedidoAtualizado = vi.fn()) {
  renderComToast(<PagamentoPedido pedido={{ idPedido: 42, statusPedido }} pagamento={pagamento} onPedidoAtualizado={onPedidoAtualizado} />)
  return onPedidoAtualizado
}

function escolherForma(rotulo, valor) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

function erroHttp(status, message) {
  return Object.assign(new Error('falha'), { response: { status, data: { message } } })
}

describe('PagamentoPedido', () => {
  afterEach(() => vi.clearAllMocks())

  it('mostra total, sinal, restante e status', () => {
    renderizar('AGUARDANDO_SINAL', PENDENTE)
    const secao = screen.getByRole('region', { name: 'Pagamento' })
    expect(secao).toHaveTextContent('R$ 250,00')
    expect(secao).toHaveTextContent('Sinal (50%)R$ 125,00 · Pendente')
    expect(secao).toHaveTextContent('RestanteR$ 125,00 · Pendente')
    expect(secao).toHaveTextContent('Aguardando sinal')
    expect(secao).toHaveTextContent('Registre o sinal antes do restante.')
  })

  it('registra o sinal com forma e data', async () => {
    api.patch.mockResolvedValue({ data: SINAL_PAGO })
    const onPedidoAtualizado = renderizar('AGUARDANDO_SINAL', PENDENTE)
    escolherForma('Forma de pagamento do sinal', 'PIX')
    fireEvent.change(screen.getByLabelText('Data do recebimento (opcional, padrão hoje)'), { target: { value: '2026-11-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sinal' }))

    expect(await screen.findByText('Sinal registrado. Pedido aguardando produção.')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith('/pagamentos/9/registrar-sinal', { formaPagamento: 'PIX', dataPagamento: '2026-11-10' })
    expect(onPedidoAtualizado).toHaveBeenCalledWith({ idPedido: 42, statusPedido: 'ESPERANDO_FAZER' })
    expect(screen.getByRole('region', { name: 'Pagamento' })).toHaveTextContent('Pago em 10/11/2026 via Pix')
  })

  it('omite a data quando vazia', async () => {
    api.patch.mockResolvedValue({ data: SINAL_PAGO })
    renderizar('AGUARDANDO_SINAL', PENDENTE)
    escolherForma('Forma de pagamento do sinal', 'PIX')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sinal' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/pagamentos/9/registrar-sinal', { formaPagamento: 'PIX' }))
  })

  it('exige a forma de pagamento', () => {
    renderizar('AGUARDANDO_SINAL', PENDENTE)
    const botao = screen.getByRole('button', { name: 'Registrar sinal' })
    expect(botao).toBeDisabled()
    fireEvent.click(botao)
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('sinal pago fica somente leitura', () => {
    renderizar('EM_PRODUCAO', SINAL_PAGO)
    expect(screen.getByRole('region', { name: 'Pagamento' })).toHaveTextContent('Pago em 10/11/2026 via Pix')
    expect(screen.queryByLabelText('Forma de pagamento do sinal')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar sinal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar restante' })).toBeInTheDocument()
  })

  it('registra o restante de pedido entregue', async () => {
    api.patch.mockResolvedValue({ data: QUITADO })
    const onPedidoAtualizado = renderizar('ENTREGUE', SINAL_PAGO)
    expect(screen.getByText('A receber: R$ 125,00')).toBeInTheDocument()
    escolherForma('Forma de pagamento do restante', 'DINHEIRO')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar restante' }))

    expect(await screen.findByText('Restante registrado. Pedido pago integralmente.')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith('/pagamentos/9/registrar-restante', { formaPagamento: 'DINHEIRO' })
    expect(screen.getByRole('region', { name: 'Pagamento' })).toHaveTextContent('Pago integralmente')
    expect(screen.queryByRole('button', { name: 'Registrar restante' })).not.toBeInTheDocument()
    expect(onPedidoAtualizado).not.toHaveBeenCalled()
  })

  it.each([
    [409, 'O sinal deste pedido já foi registrado.'],
    [422, 'A data de pagamento não pode estar no futuro.'],
  ])('mostra a mensagem do servidor no erro %i', async (status, mensagem) => {
    api.patch.mockRejectedValue(erroHttp(status, mensagem))
    renderizar('AGUARDANDO_SINAL', PENDENTE)
    escolherForma('Forma de pagamento do sinal', 'CARTAO_DEBITO')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sinal' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByLabelText('Forma de pagamento do sinal')).toHaveValue('CARTAO_DEBITO')
  })

  it('pedido sem pagamento', async () => {
    api.get.mockRejectedValue(erroHttp(404, 'Pagamento não encontrado'))
    renderizar('ORCAMENTO', undefined)
    expect(screen.getByText('Carregando pagamento...')).toHaveAttribute('role', 'status')
    expect(await screen.findByText('O pagamento é criado quando o pedido é confirmado.')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/pagamentos/pedido/42')
    expect(screen.queryByRole('button', { name: /Registrar/ })).not.toBeInTheDocument()
  })

  it('erro de carga permite tentar novamente', async () => {
    api.get.mockRejectedValueOnce(erroHttp(500)).mockResolvedValueOnce({ data: PENDENTE })
    renderizar('AGUARDANDO_SINAL', undefined)
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('button', { name: 'Registrar sinal' })).toBeInTheDocument()
  })

  it('pedido cancelado não oferece registro', () => {
    renderizar('CANCELADO', SINAL_PAGO)
    expect(screen.getByRole('region', { name: 'Pagamento' })).toHaveTextContent('R$ 250,00')
    expect(screen.queryByRole('button', { name: /Registrar/ })).not.toBeInTheDocument()
  })
})
