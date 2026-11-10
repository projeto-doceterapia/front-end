import axios from 'axios'
import { somenteDigitos } from '../components/endereco/enderecoUtils'

// A separate instance on purpose: the login cookie of services/api.js must never reach a third party.
const brasilApi = axios.create({
  baseURL: 'https://brasilapi.com.br/api/cep/v2',
  withCredentials: false,
  timeout: 8000,
})

export const ERRO_CEP = {
  INVALIDO: 'CEP_INVALIDO',
  NAO_ENCONTRADO: 'CEP_NAO_ENCONTRADO',
  INDISPONIVEL: 'SERVICO_INDISPONIVEL',
}

function erroCep(codigo) {
  const erro = new Error(codigo)
  erro.codigo = codigo
  return erro
}

export async function buscarEndereco(cep) {
  const digitos = somenteDigitos(cep)
  if (digitos.length !== 8) throw erroCep(ERRO_CEP.INVALIDO)

  let dados
  try {
    const resposta = await brasilApi.get(`/${digitos}`)
    dados = resposta.data
  } catch (erro) {
    const status = erro.response?.status
    throw erroCep(status === 404 || status === 400 ? ERRO_CEP.NAO_ENCONTRADO : ERRO_CEP.INDISPONIVEL)
  }

  return {
    rua: dados.street ?? '',
    bairro: dados.neighborhood ?? '',
    cidade: dados.city ?? '',
    uf: dados.state ?? '',
  }
}
