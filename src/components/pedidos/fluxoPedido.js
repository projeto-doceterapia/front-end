// AGUARDANDO_SINAL is left out on purpose: the API only moves it forward when the signal payment is registered.
export const PROXIMA_FASE = {
  ORCAMENTO: 'AGUARDANDO_SINAL',
  ESPERANDO_FAZER: 'EM_PRODUCAO',
  EM_PRODUCAO: 'AGUARDANDO_ENTREGA',
  AGUARDANDO_ENTREGA: 'ENTREGUE',
}

export const ROTULO_ACAO_FASE = {
  ORCAMENTO: 'Confirmar pedido',
  ESPERANDO_FAZER: 'Iniciar produção',
  EM_PRODUCAO: 'Marcar como pronto',
  AGUARDANDO_ENTREGA: 'Marcar como entregue',
}

export const CONFIRMACAO_FASE = {
  ESPERANDO_FAZER: {
    titulo: 'Iniciar produção?',
    mensagem: 'Os insumos serão baixados do estoque e a baixa não é desfeita se o pedido for cancelado.',
    perigoso: false,
  },
  AGUARDANDO_ENTREGA: {
    titulo: 'Marcar como entregue?',
    mensagem: 'Depois de entregue, o pedido não pode mais mudar de fase nem ser cancelado.',
    perigoso: true,
  },
}

export const TIPO_CANCELAMENTO = {
  CLIENTE_DESISTIU: 'Cliente desistiu',
  ERRO_PEDIDO: 'Erro no pedido',
  FALTA_INSUMO: 'Falta de insumo',
  OUTRO: 'Outro',
}

export const TIPO_RETORNO = {
  DEVOLUCAO: 'Devolução do valor',
  SEM_DEVOLUCAO: 'Sem devolução',
}

const FASES_FINAIS = ['ENTREGUE', 'CANCELADO']

const MENSAGEM_POR_STATUS = {
  400: 'Essa mudança não é permitida para o pedido.',
  403: 'Seu perfil não pode fazer esta ação.',
  404: 'Pedido não encontrado. Atualize a tela.',
  409: 'O pedido mudou ou já foi cancelado. Atualize a tela.',
  422: 'A regra do pedido impediu a ação.',
}

export function proximaFase(statusAtual) {
  return PROXIMA_FASE[statusAtual] || null
}

export function precisaConfirmar(statusAtual) {
  return Boolean(CONFIRMACAO_FASE[statusAtual])
}

export function podeCancelar(status) {
  return Boolean(status) && !FASES_FINAIS.includes(status)
}

export function mensagemErro(erro, padrao = 'Não foi possível concluir a ação. Tente novamente.') {
  const resposta = erro?.response
  if (!resposta) return 'Não foi possível falar com o servidor. Tente novamente.'
  const mensagem = resposta.data?.message
  if (typeof mensagem === 'string' && mensagem.trim()) return mensagem
  return MENSAGEM_POR_STATUS[resposta.status] || padrao
}
