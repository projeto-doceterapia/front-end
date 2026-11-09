import { paraData } from './periodoUtils'

export const RESSALVA_LUCRO = 'Estimativa: compara o faturamento das entregas com as compras do período, não o consumo exato de insumos.'

export const ROTULOS_STATUS_PEDIDO = {
  ORCAMENTO: 'Orçamento',
  AGUARDANDO_SINAL: 'Aguardando sinal',
  ESPERANDO_FAZER: 'Aguardando produção',
  EM_PRODUCAO: 'Em produção',
  AGUARDANDO_ENTREGA: 'Aguardando entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

const STATUS_DO_RELATORIO = Object.keys(ROTULOS_STATUS_PEDIDO).filter((status) => status !== 'CANCELADO')

const FORMATO_DINHEIRO = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Intl separates the symbol with a no-break space; a plain space keeps copied text and tests simple.
export function formatarDinheiro(valor) {
  return FORMATO_DINHEIRO.format(Number(valor ?? 0)).replace(/\u00a0/g, ' ')
}

export function formatarDataBr(iso) {
  return paraData(iso).toLocaleDateString('pt-BR')
}

export function formatarGeracao(agora) {
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${agora.toLocaleDateString('pt-BR')} às ${hora}`
}

export function linhasDePedidos(pedidosPorStatus) {
  return STATUS_DO_RELATORIO.map((status) => ({
    status,
    rotulo: ROTULOS_STATUS_PEDIDO[status],
    quantidade: pedidosPorStatus?.[status] ?? 0,
  }))
}

export function contarPedidos(pedidosPorStatus) {
  return linhasDePedidos(pedidosPorStatus).reduce((soma, linha) => soma + linha.quantidade, 0)
}

export function topCinco(lista) {
  return (lista ?? []).slice(0, 5)
}

export function percentualDaBarra(valor, maior) {
  return Number(maior) > 0 ? Math.max(0, Math.min(100, (Number(valor) / Number(maior)) * 100)) : 0
}

export function mensagemErroRelatorio(erro) {
  const resposta = erro?.response
  if (!resposta) return 'Não foi possível carregar o relatório. Tente novamente.'
  if (resposta.status === 403) return 'Seu perfil não pode gerar o relatório.'
  return resposta.data?.message || 'Não foi possível carregar o relatório.'
}
