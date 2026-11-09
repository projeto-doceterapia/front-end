import { mensagemErro, numeroDecimal, unidades } from '../estoque/estoqueUtils'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const SEM_VALOR = '—'

export const UNIDADES_COMPATIVEIS = {
  KG: ['KG', 'G'],
  G: ['KG', 'G'],
  L: ['L', 'ML'],
  ML: ['L', 'ML'],
  UNIDADE: ['UNIDADE'],
}

const MENSAGENS_POR_STATUS = {
  400: 'Confira os campos informados.',
  403: 'Seu perfil não pode alterar preços nem a ficha técnica.',
  404: 'Produto ou insumo não encontrado. Atualize a tela.',
  422: 'A unidade escolhida não combina com a unidade do insumo.',
}

const MENSAGEM_SERVIDOR = 'Não foi possível falar com o servidor. Tente novamente.'

export function formatarMoeda(valor) {
  return valor == null ? SEM_VALOR : moeda.format(Number(valor))
}

export function formatarPercentual(valor) {
  return `${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

export function formatarQuantidade(linha) {
  const quantidade = Number(linha.quantidadeUtilizada || 0)
  return `${quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unidades[linha.unidade] ?? ''}`.trim()
}

export function unidadesCompativeis(unidadeInsumo) {
  return UNIDADES_COMPATIVEIS[unidadeInsumo] ?? []
}

export function precoAbaixoDoSugerido(produto) {
  if (produto.precoSugerido == null || produto.precoAtual == null) return false
  return Number(produto.precoAtual) < Number(produto.precoSugerido)
}

export function margemParaEnvio(texto) {
  const limpo = String(texto ?? '').trim()
  return limpo === '' ? null : numeroDecimal(limpo)
}

export function mensagemErroProduto(erro, padrao = 'Não foi possível concluir a ação. Tente novamente.') {
  const doServidor = erro.response ? mensagemErro(erro, '') : ''
  if (doServidor) return doServidor

  const status = erro.response?.status
  if (!status || status >= 500) return MENSAGEM_SERVIDOR
  return MENSAGENS_POR_STATUS[status] ?? padrao
}
