import { AxiosError } from 'axios'
import api from '../services/api'

export const FALHA_DE_REDE = 'falha-de-rede'

// Answers through the real axios instance, so the response interceptor runs as in production.
// `rotas` maps 'METHOD /url' to { status, data }, FALHA_DE_REDE or a function returning either.
export default function instalarApiFalsa(rotas) {
  const chamadas = []

  api.defaults.adapter = async (config) => {
    const rota = `${config.method.toUpperCase()} ${config.url}`
    chamadas.push({ rota, corpo: config.data })

    const configurada = rotas[rota]
    if (configurada === undefined) throw new Error(`Rota sem resposta configurada: ${rota}`)
    const resposta = typeof configurada === 'function' ? await configurada() : configurada

    if (resposta === FALHA_DE_REDE) {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
    }

    const respostaAxios = { data: resposta.data, status: resposta.status, statusText: '', headers: {}, config }
    if (resposta.status >= 400) {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, respostaAxios)
    }
    return respostaAxios
  }

  return {
    chamadasDe: (rota) => chamadas.filter((chamada) => chamada.rota === rota),
    total: () => chamadas.length,
    rotas,
  }
}
