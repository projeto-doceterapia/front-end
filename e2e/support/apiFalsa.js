import { respostaExemplo } from './dadosExemplo'

const API = 'http://localhost:8080'

const USUARIO_DE_TESTE = { id: 1, nome: 'Usuária de Teste', email: 'teste@example.com' }

const STATUS_PEDIDO = ['ORCAMENTO', 'AGUARDANDO_SINAL', 'ESPERANDO_FAZER', 'EM_PRODUCAO', 'AGUARDANDO_ENTREGA', 'ENTREGUE', 'CANCELADO']

const INDICADORES_OPERACIONAIS = {
  pedidosPorStatus: Object.fromEntries(STATUS_PEDIDO.map((status) => [status, 0])),
  pedidosHoje: 0,
  pedidosSemana: 0,
  pedidosPorDia: [],
  diasLotados: [],
  produtosMaisVendidos: [],
  insumosAbaixoDoMinimo: [],
}

const INDICADORES_FINANCEIROS = {
  faturamento: { total: 0, recebido: 0, aReceber: 0 },
  ticketMedio: 0,
  gastosInsumos: 0,
  lucroEstimado: 0,
  margem: 0,
  produtosMaisVendidosPorFaturamento: [],
  cancelados: { quantidade: 0, pago: 0, devolvido: 0, retido: 0 },
  emOrcamento: { quantidade: 0, valor: 0 },
  faturamentoPorMes: [],
}

// Answers every API call in the browser so the e2e suite never needs the back-end or real data.
export async function simularApi(page, { logado = false, loginValido = true, dados = 'vazio' } = {}) {
  let sessaoAtiva = logado

  await page.route(`${API}/**`, (rota) => {
    const url = new URL(rota.request().url())
    const { pathname } = url

    if (pathname === '/usuarios/me') {
      return sessaoAtiva
        ? rota.fulfill({ status: 200, json: USUARIO_DE_TESTE })
        : rota.fulfill({ status: 401, json: {} })
    }
    if (pathname === '/usuarios/login') {
      sessaoAtiva = loginValido
      return rota.fulfill({ status: loginValido ? 200 : 401, json: {} })
    }
    if (pathname === '/usuarios/logout') {
      sessaoAtiva = false
      return rota.fulfill({ status: 204 })
    }
    if (dados === 'exemplo' && rota.request().method() === 'GET') {
      const resposta = respostaExemplo(url)
      if (resposta !== undefined) return rota.fulfill({ status: 200, json: resposta })
    }
    if (pathname === '/indicadores/operacionais') {
      return rota.fulfill({ status: 200, json: INDICADORES_OPERACIONAIS })
    }
    if (pathname === '/indicadores/financeiros') {
      return rota.fulfill({ status: 200, json: INDICADORES_FINANCEIROS })
    }
    return rota.fulfill({ status: 200, json: [] })
  })
}
