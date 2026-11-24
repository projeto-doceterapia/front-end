import { atualizarItem, cadastrarItem, removerItem } from '../../services/itensPedido'

// Mirrors the API rule: items change only before production starts and while the order is not fully paid.
const FASES_COM_ITENS_EDITAVEIS = ['ORCAMENTO', 'AGUARDANDO_SINAL', 'ESPERANDO_FAZER']

export function podeEditarItens(status, pagamento) {
  return FASES_COM_ITENS_EDITAVEIS.includes(status) && pagamento?.statusPagamento !== 'PAGO_INTEGRAL'
}

function corpo(linha, pedidoId) {
  return {
    fkProduto: Number(linha.fkProduto),
    fkPedido: Number(pedidoId),
    quantidade: Number(linha.quantidade),
    valorUnitario: Number(linha.valorUnitario),
    observacao: linha.observacao || null,
  }
}

// Removals go first because they only lower the supply requirement and are never checked.
export function montarOperacoes(originais, linhas, pedidoId, nomeProduto) {
  const removidos = originais.filter((item) => !linhas.some((linha) => linha.idProdutoPedido === item.idProdutoPedido))
  const alterados = linhas.filter((linha) => {
    const original = originais.find((item) => item.idProdutoPedido === linha.idProdutoPedido)
    return original && Number(original.quantidade) !== Number(linha.quantidade)
  })
  const novos = linhas.filter((linha) => !linha.idProdutoPedido)
  return [
    ...removidos.map((item) => ({
      descricao: nomeProduto(item.fkProduto),
      verifica: false,
      executar: () => removerItem(item.idProdutoPedido),
      aplicar: (lista) => lista.filter((atual) => atual.idProdutoPedido !== item.idProdutoPedido),
    })),
    ...alterados.map((linha) => ({
      descricao: nomeProduto(linha.fkProduto),
      verifica: true,
      executar: (confirmarComFalta) => atualizarItem(linha.idProdutoPedido, corpo(linha, pedidoId), confirmarComFalta),
      aplicar: (lista, salvo) => lista.map((atual) => (atual.idProdutoPedido === salvo.idProdutoPedido ? salvo : atual)),
    })),
    ...novos.map((linha) => ({
      descricao: nomeProduto(linha.fkProduto),
      verifica: true,
      executar: (confirmarComFalta) => cadastrarItem(corpo(linha, pedidoId), confirmarComFalta),
      aplicar: (lista, salvo) => [...lista, salvo],
    })),
  ]
}
