import { unidades } from '../estoque/estoqueUtils'

export function extrairFaltas(erro) {
  const resposta = erro?.response
  const faltas = resposta?.data?.faltas
  return resposta?.status === 422 && Array.isArray(faltas) && faltas.length ? faltas : null
}

export function formatarQuantidade(valor, unidade) {
  const numero = Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
  return `${numero} ${unidades[unidade] ?? unidade ?? ''}`.trim()
}

export function quantidadeFaltante(falta) {
  return Math.round((Number(falta.necessario) - Number(falta.disponivel)) * 1000) / 1000
}

export function contarSemFichaTecnica(itens) {
  return itens.filter((item) => item.semFichaTecnica === true).length
}

export function textoSemFichaTecnica(quantidade) {
  const sujeito = quantidade === 1 ? '1 item sem ficha técnica' : `${quantidade} itens sem ficha técnica`
  return `${sujeito}: estoque não verificado.`
}
