import api from './api'

export function listarProdutos() {
  return api.get('/produtos').then((resposta) => resposta.data || [])
}

export function salvarProduto(id, produto) {
  return id ? api.put(`/produtos/${id}`, produto) : api.post('/produtos', produto)
}

export function listarCategorias() {
  return api.get('/categorias-produto').then((resposta) => resposta.data || [])
}

export function salvarCategoria(categoria) {
  const { idCategoriaProduto, nome, descricao } = categoria
  const corpo = { nome, descricao }
  return idCategoriaProduto
    ? api.put(`/categorias-produto/${idCategoriaProduto}`, corpo).then((resposta) => resposta.data)
    : api.post('/categorias-produto', corpo).then((resposta) => resposta.data)
}

export function listarInsumos() {
  return api.get('/insumos').then((resposta) => resposta.data || [])
}

export function listarFicha(produtoId) {
  return api.get(`/produtos/${produtoId}/insumos`).then((resposta) => resposta.data || [])
}

export function adicionarLinha(produtoId, dados) {
  return api.post(`/produtos/${produtoId}/insumos`, dados).then((resposta) => resposta.data)
}

export function atualizarLinha(produtoId, idLinha, dados) {
  return api.put(`/produtos/${produtoId}/insumos/${idLinha}`, dados).then((resposta) => resposta.data)
}

export function removerLinha(produtoId, idLinha) {
  return api.delete(`/produtos/${produtoId}/insumos/${idLinha}`)
}

export function buscarConfiguracaoPrecificacao() {
  return api.get('/configuracao-precificacao').then((resposta) => resposta.data)
}

export function salvarConfiguracaoPrecificacao(dados) {
  return api.put('/configuracao-precificacao', dados).then((resposta) => resposta.data)
}
