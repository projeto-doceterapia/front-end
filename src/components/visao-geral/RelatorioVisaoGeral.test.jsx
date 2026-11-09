import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import RelatorioVisaoGeral from './RelatorioVisaoGeral'
import api from '../../services/api'

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }))

const OPERACIONAIS = {
  periodo: { de: '2026-11-01', ate: '2026-11-30' },
  pedidosPorStatus: { ORCAMENTO: 3, AGUARDANDO_SINAL: 2, ESPERANDO_FAZER: 0, EM_PRODUCAO: 0, AGUARDANDO_ENTREGA: 0, ENTREGUE: 16, CANCELADO: 1 },
  produtosMaisVendidos: [1, 2, 3, 4, 5, 6, 7].map((numero) => ({ produtoId: numero, nome: `Quantidade ${numero}`, quantidade: 50 - numero })),
  insumosAbaixoDoMinimo: [{ insumoId: 7, nome: 'Chocolate meio amargo', saldo: 0.8, minimo: 2, unidade: 'KG' }],
}

const FINANCEIROS = {
  periodo: { de: '2026-11-01', ate: '2026-11-30' },
  faturamento: { total: 3200, recebido: 2500, aReceber: 700 },
  ticketMedio: 177.78,
  gastosInsumos: 950,
  lucroEstimado: 2250,
  produtosMaisVendidosPorFaturamento: [1, 2, 3, 4, 5, 6, 7].map((numero) => ({ produtoId: numero, nome: `Faturamento ${numero}`, valor: 700 - numero * 10 })),
  cancelados: { quantidade: 1, pago: 80, devolvido: 40, retido: 40 },
  emOrcamento: { quantidade: 3, valor: 450 },
}

const VAZIO_OPERACIONAIS = {
  ...OPERACIONAIS,
  pedidosPorStatus: Object.fromEntries(Object.keys(OPERACIONAIS.pedidosPorStatus).map((chave) => [chave, 0])),
  produtosMaisVendidos: [],
  insumosAbaixoDoMinimo: [],
}

const VAZIO_FINANCEIROS = {
  ...FINANCEIROS,
  faturamento: { total: 0, recebido: 0, aReceber: 0 },
  ticketMedio: 0,
  gastosInsumos: 0,
  lucroEstimado: 0,
  produtosMaisVendidosPorFaturamento: [],
  cancelados: { quantidade: 0, pago: 0, devolvido: 0, retido: 0 },
  emOrcamento: { quantidade: 0, valor: 0 },
}

function responder(operacionais = OPERACIONAIS, financeiros = FINANCEIROS) {
  api.get.mockImplementation((url) => {
    if (url === '/indicadores/operacionais') return Promise.resolve({ data: operacionais })
    if (url === '/indicadores/financeiros') return Promise.resolve({ data: financeiros })
    return Promise.reject(new Error(`Rota inesperada: ${url}`))
  })
}

async function abrir() {
  render(<RelatorioVisaoGeral onBack={vi.fn()} />)
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false'))
}

describe('RelatorioVisaoGeral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 20, 14, 5) })
    responder()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('carrega os dois indicadores do mês', async () => {
    await abrir()

    expect(screen.getByLabelText('De')).toHaveValue('2026-11-01')
    expect(screen.getByLabelText('Até')).toHaveValue('2026-11-30')
    expect(api.get).toHaveBeenCalledWith('/indicadores/operacionais', { params: { de: '2026-11-01', ate: '2026-11-30' } })
    expect(api.get).toHaveBeenCalledWith('/indicadores/financeiros', { params: { de: '2026-11-01', ate: '2026-11-30' } })
  })

  it('mostra logo, nome do negócio e slogan', async () => {
    await abrir()

    expect(screen.getByAltText('Logo Doceterapia')).toBeInTheDocument()
    expect(screen.getByText('Doceterapia')).toBeInTheDocument()
    expect(screen.getByText('Por uma gestão mais doce!')).toBeInTheDocument()
    expect(screen.getByText('Período: 01/11/2026 a 30/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Gerado em 20/11/2026 às 14:05')).toBeInTheDocument()
  })

  it('mostra as sete seções com os números do servidor', async () => {
    await abrir()

    const titulos = screen.getAllByRole('heading', { level: 2 }).map((titulo) => titulo.textContent)
    expect(titulos).toEqual([
      'Faturamento', 'Pedidos', 'Produtos mais vendidos', 'Gastos com insumos', 'Lucro estimado',
      'Insumos abaixo do mínimo (saldo em 20/11/2026)',
    ])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Relatório do período')
    expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 700,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 3.200,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 177,78')).toBeInTheDocument()
    expect(screen.getByText('R$ 950,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 2.250,00')).toBeInTheDocument()
    expect(screen.getByText('Chocolate meio amargo')).toBeInTheDocument()
  })

  it('cancelados ficam à parte', async () => {
    await abrir()

    const pedidos = screen.getByRole('region', { name: 'Pedidos' })
    const tabela = within(pedidos).getByRole('table')
    expect(within(tabela).queryByText('Cancelado')).not.toBeInTheDocument()
    expect(within(tabela).getByText('Aguardando produção')).toBeInTheDocument()
    expect(within(tabela).getByRole('row', { name: /Total 21/ })).toBeInTheDocument()
    expect(within(pedidos).getByText('Em orçamento: 3 pedidos, R$ 450,00 (fora do faturamento).')).toBeInTheDocument()
    const cancelados = within(pedidos).getByRole('heading', { name: 'Cancelados' }).parentElement
    expect(within(cancelados).getByText('R$ 80,00')).toBeInTheDocument()
    expect(within(cancelados).getAllByText('R$ 40,00')).toHaveLength(2)
  })

  it('top 5 por quantidade e por faturamento', async () => {
    await abrir()

    expect(screen.getByText('Quantidade 5')).toBeInTheDocument()
    expect(screen.queryByText('Quantidade 6')).not.toBeInTheDocument()
    expect(screen.getByText('Faturamento 5')).toBeInTheDocument()
    expect(screen.queryByText('Faturamento 6')).not.toBeInTheDocument()
  })

  it('lucro com a ressalva', async () => {
    await abrir()

    const secao = screen.getByRole('region', { name: 'Lucro estimado' })
    expect(within(secao).getByText('R$ 2.250,00')).toBeInTheDocument()
    expect(within(secao).getByText('Estimativa: compara o faturamento das entregas com as compras do período, não o consumo exato de insumos.')).toBeInTheDocument()
  })

  it('imprime pelo navegador', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {})
    await abrir()

    fireEvent.click(screen.getByRole('button', { name: /Imprimir ou salvar PDF/ }))

    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('não chama a API com período inválido', async () => {
    await abrir()
    api.get.mockClear()

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2025-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))

    expect(api.get).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('O período máximo é de 366 dias.')
    expect(screen.getByRole('button', { name: /Imprimir ou salvar PDF/ })).toBeDisabled()
  })

  it('atualiza o relatório com o novo período', async () => {
    await abrir()
    api.get.mockClear()

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-09-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/indicadores/financeiros', { params: { de: '2026-09-01', ate: '2026-11-30' } }))
    expect(await screen.findByText('Período: 01/09/2026 a 30/11/2026')).toBeInTheDocument()
  })

  it('estados de carga e erro', async () => {
    api.get.mockImplementation(() => new Promise(() => {}))
    render(<RelatorioVisaoGeral onBack={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Gerando relatório...')
    expect(screen.getByRole('button', { name: /Imprimir ou salvar PDF/ })).toBeDisabled()
  })

  it('mostra a mensagem do servidor no 400 e refaz as duas chamadas ao tentar novamente', async () => {
    api.get.mockRejectedValue({ response: { status: 400, data: { message: 'O período máximo por consulta é de 366 dias.' } } })
    render(<RelatorioVisaoGeral onBack={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('O período máximo por consulta é de 366 dias.')
    expect(screen.getByRole('button', { name: /Imprimir ou salvar PDF/ })).toBeDisabled()

    responder()
    api.get.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false'))
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('region', { name: 'Faturamento' })).toBeInTheDocument()
  })

  it('avisa quando não há resposta do servidor', async () => {
    api.get.mockRejectedValue(new Error('Network Error'))
    render(<RelatorioVisaoGeral onBack={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o relatório. Tente novamente.')
  })

  it('período sem pedidos', async () => {
    responder(VAZIO_OPERACIONAIS, VAZIO_FINANCEIROS)
    await abrir()

    expect(screen.getByText('Nenhum pedido com entrega no período.')).toBeInTheDocument()
    expect(screen.getAllByText('Nenhum produto vendido no período.')).toHaveLength(2)
    expect(screen.getByText('Nenhum insumo abaixo do mínimo.')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 0,00').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Imprimir ou salvar PDF/ })).toBeEnabled()
  })

  it('volta para a Visão Geral', async () => {
    const aoVoltar = vi.fn()
    render(<RelatorioVisaoGeral onBack={aoVoltar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Voltar à Visão Geral' }))

    expect(aoVoltar).toHaveBeenCalledTimes(1)
  })
})
