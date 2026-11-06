import api from './api'

export function listarUsuarios() {
  // The API answers 204 without a body when there are no users.
  return api.get('/usuarios').then((resposta) => (resposta.status === 204 ? [] : resposta.data ?? []))
}

export function criarUsuario({ nome, email, senha, perfil }) {
  return api.post('/usuarios', { nome, email, senha, perfil })
}
