import api from './api'

const ROTA_USUARIO_LOGADO = '/usuarios/me'

export function entrar(email, senha) {
  return api.post('/usuarios/login', { email, senha })
}

export function buscarUsuarioLogado() {
  return api.get(ROTA_USUARIO_LOGADO).then((resposta) => resposta.data)
}

export function encerrar() {
  return api.post('/usuarios/logout')
}

export function ehFalhaAoBuscarUsuario(erro) {
  return erro.config?.url === ROTA_USUARIO_LOGADO
}
