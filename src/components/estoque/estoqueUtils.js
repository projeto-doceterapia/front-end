export const unidades = { KG: 'kg', G: 'g', L: 'L', ML: 'ml', UNIDADE: 'un.' }

export function nivelEstoque(insumo) {
  const minimo = Number(insumo.quantidadeMinima)
  const proporcao = minimo > 0 ? Number(insumo.quantidadeAtual) / minimo : 1
  return {
    proporcao,
    percentual: Math.round(Math.max(0, Math.min(1, proporcao)) * 100),
    status: proporcao <= 0.5 ? 'critico' : proporcao < 1 ? 'baixo' : 'normal',
  }
}

export function mensagemErro(erro, padrao) {
  const dados = erro.response?.data
  return typeof dados === 'string' && dados.length < 250 ? dados : dados?.message || dados?.mensagem || padrao
}

export function numeroDecimal(valor) {
  return Number(String(valor).replace(',', '.'))
}
