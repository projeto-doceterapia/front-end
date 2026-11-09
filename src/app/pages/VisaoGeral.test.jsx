import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import VisaoGeral from './VisaoGeral'
import api from '../../services/api'
import useSessao from '../../components/sessao/useSessao'

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }))
vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const OPERACIONAIS = {
  periodo: { de: '2026-11-01', ate: '2026-11-30' },
  pedidosPorStatus: { ORCAMENTO: 0, AGUARDANDO_SINAL: 1, ESPERANDO_FAZER: 0, EM_PRODUCAO: 1, AGUARDANDO_ENTREGA: 0, ENTREGUE: 2, CANCELADO: 1 },
  pedidosHoje: 0,
  pedidosSemana: 3,
  pedidosPorDia: [{ data: '2026-11-05', quantidade: 1 }, { data: '2026-11-20', quantidade: 3 }],
  diasLotados: [{ data: '2026-11-20', quantidade: 3 }],
  produtosMaisVendidos: [
    { produtoId: 5, nome: 'Brigadeiro gourmet', quantidade: 50 },
    { produtoId: 4, nome: 'Bolo de pote', quantidade: 15 },
  ],
  insumosAbaixoDoMinimo: [{ insumoId: 7, nome: 'Chocolate meio amargo', saldo: 0.8, minimo: 2, unidade: 'KG' }],
}

const FINANCEIROS = {
  periodo: { de: '2026-11-01', ate: '2026-11-30' },
  faturamento: { total: 395, recebido: 290, aReceber: 105 },
  ticketMedio: 98.75,
  gastosInsumos: 109.3,
  lucroEstimado: 285.7,
  produtosMaisVendidosPorFaturamento: [],
  cancelados: { quantidade: 1, pago: 40, devolvido: 20, retido: 20 },
  emOrcamento: { quantidade: 2, valor: 150 },
  faturamentoPorMes: [
    { mes: '2026-06', total: 0 }, { mes: '2026-07', total: 0 }, { mes: '2026-08', total: 0 },
    { mes: '2026-09', total: 0 }, { mes: '2026-10', total: 36 }, { mes: '2026-11', total: 395 },
  ],
}

const SEM_PEDIDOS = {
  ...OPERACIONAIS,
  pedidosPorStatus: Object.fromEntries(Object.keys(OPERACIONAIS.pedidosPorStatus).map((chave) => [chave, 0])),
  pedidosPorDia: [],
  diasLotados: [],
  produtosMaisVendidos: [],
  insumosAbaixoDoMinimo: [],
}

function responder(operacionais = OPERACIONAIS) {
  api.get.mockImplementation((url) => {
    if (url === '/indicadores/operacionais') return Promise.resolve({ data: operacionais })
    if (url === '/indicadores/financeiros') return Promise.resolve({ data: FINANCEIROS })
    return Promise.reject(new Error(`Rota inesperada: ${url}`))
  })
}

function valorDoCartao(titulo) {
  return screen.getByText(titulo, { selector: 'p' }).closest('article').querySelector('strong').textContent
}

async function abrir(perfil = 'DONA') {
  useSessao.mockReturnValue({ perfil, ehDona: perfil === 'DONA' })
  render(<VisaoGeral />)
  await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false'))
}

describe('VisaoGeral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 18, 10, 0) })
    responder()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('abre no mês atual sem baixar listas', async () => {
    await abrir('DONA')

    expect(api.get).toHaveBeenCalledWith('/indicadores/operacionais', { params: { de: '2026-11-01', ate: '2026-11-30' } })
    expect(api.get).toHaveBeenCalledWith('/indicadores/financeiros', { params: { de: '2026-11-01', ate: '2026-11-30' } })
    const rotas = api.get.mock.calls.map(([url]) => url)
    for (const lista of ['/pedidos', '/insumos', '/produtos', '/itens-pedido']) {
      expect(rotas).not.toContain(lista)
    }
  })

  it('mostra os números do servidor para a DONA', async () => {
    await abrir('DONA')

    expect(valorDoCartao('Faturamento')).toBe('R$ 395,00')
    expect(screen.getByText('Recebido R$ 290,00 · A receber R$ 105,00')).toBeInTheDocument()
    expect(valorDoCartao('Ticket médio')).toBe('R$ 98,75')
    expect(valorDoCartao('Gastos com insumos')).toBe('R$ 109,30')
    expect(valorDoCartao('Lucro estimado')).toBe('R$ 285,70')
    expect(screen.getByText('Em orçamento')).toBeInTheDocument()
    expect(screen.getByText('Chocolate meio amargo')).toBeInTheDocument()
    expect(screen.getByText('Brigadeiro gourmet')).toBeInTheDocument()
    expect(screen.getByText('Faturamento mensal')).toBeInTheDocument()
  })

  it('mostra carregando enquanto a chamada está pendente', () => {
    useSessao.mockReturnValue({ perfil: 'DONA', ehDona: true })
    api.get.mockReturnValue(new Promise(() => {}))

    render(<VisaoGeral />)

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Carregando indicadores...')).toBeInTheDocument()
  })

  it('mostra erro com opção de tentar novamente', async () => {
    useSessao.mockReturnValue({ perfil: 'DONA', ehDona: true })
    api.get.mockRejectedValue(new Error('falha'))
    render(<VisaoGeral />)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Não foi possível carregar a Visão Geral.')

    responder()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Faturamento mensal')).toBeInTheDocument()
  })

  it('mostra a mensagem de vazio quando o período não tem pedidos', async () => {
    responder(SEM_PEDIDOS)
    await abrir('DONA')

    expect(screen.getAllByText('Nenhum pedido com entrega neste período.').length).toBeGreaterThan(0)
  })

  it('funcionária não vê valores financeiros', async () => {
    await abrir('FUNCIONARIA')

    expect(api.get).not.toHaveBeenCalledWith('/indicadores/financeiros', expect.anything())
    expect(screen.queryByText('Lucro estimado')).not.toBeInTheDocument()
    expect(screen.queryByText('Ticket médio')).not.toBeInTheDocument()
    expect(screen.queryByText('Gastos com insumos')).not.toBeInTheDocument()
    expect(screen.queryByText('Faturamento mensal')).not.toBeInTheDocument()
    expect(screen.getByText('Dias lotados')).toBeInTheDocument()
  })

  it('troca de período e busca de novo', async () => {
    await abrir('DONA')

    fireEvent.click(screen.getByRole('button', { name: 'Mês passado' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      '/indicadores/operacionais', { params: { de: '2026-10-01', ate: '2026-10-31' } }))
    expect(api.get).toHaveBeenCalledWith('/indicadores/financeiros', { params: { de: '2026-10-01', ate: '2026-10-31' } })
  })

  it('período acima de 366 dias mostra aviso e não chama a API', async () => {
    await abrir('DONA')
    const chamadas = api.get.mock.calls.length

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2025-01-01' } })

    expect(screen.getByRole('alert')).toHaveTextContent('O período máximo é de 366 dias')
    expect(api.get.mock.calls.length).toBe(chamadas)
  })

  it('ressalva do lucro estimado', async () => {
    await abrir('DONA')

    expect(screen.getByText(/compara o faturamento das entregas com as compras do período, não o consumo exato de insumos/))
      .toBeInTheDocument()
  })

  it('botão do relatório só para a DONA', async () => {
    await abrir('DONA')
    expect(screen.getByRole('button', { name: 'Gerar relatório' })).toBeInTheDocument()

    cleanup()
    await abrir('FUNCIONARIA')
    expect(screen.queryByRole('button', { name: 'Gerar relatório' })).not.toBeInTheDocument()
  })

  it('abre o relatório no lugar dos painéis e devolve o foco ao voltar', async () => {
    await abrir('DONA')

    fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Relatório do período' })).toHaveFocus()
    expect(screen.queryByText('Estoque em atenção')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Voltar à Visão Geral' }))

    expect(screen.getByRole('button', { name: 'Gerar relatório' })).toHaveFocus()
  })
})
