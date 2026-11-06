import axios from 'axios'

// These routes answer 401 as part of their own flow, and whoever called them handles it.
const ROTAS_DE_SESSAO = ['/usuarios/login', '/usuarios/me', '/usuarios/logout']

let aoExpirarSessao = null

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
})

export function definirAoExpirarSessao(callback) {
  aoExpirarSessao = callback
  return () => {
    if (aoExpirarSessao === callback) aoExpirarSessao = null
  }
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401 && !ROTAS_DE_SESSAO.includes(erro.config?.url)) {
      aoExpirarSessao?.()
    }
    return Promise.reject(erro)
  },
)

export default api
