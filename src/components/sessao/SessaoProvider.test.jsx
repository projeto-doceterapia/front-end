import { useEffect } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import SessaoProvider from './SessaoProvider'
import useSessao from './useSessao'
import api from '../../services/api'
import instalarApiFalsa, { FALHA_DE_REDE } from '../../test/apiFalsa'
import renderComToast from '../../test/renderComToast'

const DONA = { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com', perfil: 'DONA' }
const SEM_PERFIL = { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com' }
const FUNCIONARIA = { id: 2, nome: 'Funcionária Exemplo', email: 'funcionaria@exemplo.com', perfil: 'FUNCIONARIA' }

const CHECAR = 'GET /usuarios/me'
const SAIR = 'POST /usuarios/logout'
const ENTRAR = 'POST /usuarios/login'

let sessao

function Sonda() {
  const atual = useSessao()
  useEffect(() => {
    sessao = atual
  })
  return null
}

async function montar(rotas) {
  const falsa = instalarApiFalsa(rotas)
  renderComToast(<SessaoProvider><Sonda /></SessaoProvider>)
  await waitFor(() => expect(sessao.carregando).toBe(false))
  return falsa
}

function regiaoDeErros() {
  return screen.getByRole('alert')
}

describe('SessaoProvider', () => {
  beforeEach(() => {
    sessao = undefined
  })

  it('carregando só é verdadeiro durante a checagem inicial', async () => {
    let responder
    instalarApiFalsa({ [CHECAR]: () => new Promise((resolve) => { responder = resolve }) })
    renderComToast(<SessaoProvider><Sonda /></SessaoProvider>)

    expect(sessao.carregando).toBe(true)
    expect(sessao.usuario).toBeNull()

    await waitFor(() => expect(responder).toBeDefined())
    await act(async () => responder({ status: 200, data: DONA }))

    await waitFor(() => expect(sessao.carregando).toBe(false))
    expect(sessao.usuario).toEqual(DONA)
  })

  it('termina sem usuário quando não há sessão', async () => {
    const falsa = await montar({ [CHECAR]: { status: 401 } })

    expect(sessao.usuario).toBeNull()
    expect(falsa.chamadasDe(CHECAR)).toHaveLength(1)
    expect(regiaoDeErros()).toBeEmptyDOMElement()
  })

  it('termina sem usuário e sem toast quando a checagem falha na rede', async () => {
    await montar({ [CHECAR]: FALHA_DE_REDE })

    expect(sessao.usuario).toBeNull()
    expect(regiaoDeErros()).toBeEmptyDOMElement()
  })

  it('trata perfil ausente como DONA', async () => {
    await montar({ [CHECAR]: { status: 200, data: SEM_PERFIL } })

    expect(sessao.perfil).toBe('DONA')
    expect(sessao.ehDona).toBe(true)
  })

  it('ehDona falso para FUNCIONARIA', async () => {
    await montar({ [CHECAR]: { status: 200, data: FUNCIONARIA } })

    expect(sessao.perfil).toBe('FUNCIONARIA')
    expect(sessao.ehDona).toBe(false)
  })

  it('sem usuário, perfil é nulo e ehDona é falso', async () => {
    await montar({ [CHECAR]: { status: 401 } })

    expect(sessao.usuario).toBeNull()
    expect(sessao.perfil).toBeNull()
    expect(sessao.ehDona).toBe(false)
  })

  it('entrar guarda o usuário de /usuarios/me, não o corpo do login', async () => {
    const falsa = await montar({
      [CHECAR]: { status: 401 },
      [ENTRAR]: { status: 200, data: { userId: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com', token: 'jwt-ficticio' } },
    })
    falsa.rotas[CHECAR] = { status: 200, data: DONA }

    await act(() => sessao.entrar('dona@exemplo.com', 'senha-ficticia'))

    expect(JSON.parse(falsa.chamadasDe(ENTRAR)[0].corpo)).toEqual({ email: 'dona@exemplo.com', senha: 'senha-ficticia' })
    expect(sessao.usuario).toEqual(DONA)
  })

  it('entrar rejeita com o erro do axios e não guarda usuário', async () => {
    const falsa = await montar({ [CHECAR]: { status: 401 }, [ENTRAR]: { status: 401 } })

    await expect(sessao.entrar('dona@exemplo.com', 'senha-ficticia')).rejects.toMatchObject({ response: { status: 401 } })

    expect(sessao.usuario).toBeNull()
    expect(falsa.chamadasDe(CHECAR)).toHaveLength(1)
  })

  it('sair encerra a sessão quando o servidor responde 204', async () => {
    const falsa = await montar({ [CHECAR]: { status: 200, data: DONA }, [SAIR]: { status: 204 } })

    await act(() => sessao.sair())

    expect(falsa.chamadasDe(SAIR)).toHaveLength(1)
    expect(sessao.usuario).toBeNull()
    expect(regiaoDeErros()).toBeEmptyDOMElement()
  })

  it('sair trata 401 como sessão encerrada', async () => {
    await montar({ [CHECAR]: { status: 200, data: DONA }, [SAIR]: { status: 401 } })

    await act(() => sessao.sair())

    expect(sessao.usuario).toBeNull()
    expect(regiaoDeErros()).toBeEmptyDOMElement()
  })

  it.each([
    ['a rede falha', FALHA_DE_REDE],
    ['o servidor responde 500', { status: 500 }],
  ])('sair mantém a sessão quando %s', async (_caso, resposta) => {
    await montar({ [CHECAR]: { status: 200, data: DONA }, [SAIR]: resposta })

    await act(() => sessao.sair())

    expect(sessao.usuario).toEqual(DONA)
    expect(regiaoDeErros()).toHaveTextContent('Não foi possível sair. Tente novamente.')
  })

  it('volta ao login uma vez em 401 de rota de negócio', async () => {
    const falsa = await montar({
      [CHECAR]: { status: 200, data: DONA },
      'GET /insumos': { status: 401 },
      'GET /clientes': { status: 401 },
      'GET /pedidos': { status: 401 },
    })
    const requisicoesAntes = falsa.total()

    await act(async () => {
      await Promise.allSettled([api.get('/insumos'), api.get('/clientes'), api.get('/pedidos')])
    })

    expect(sessao.usuario).toBeNull()
    expect(screen.getAllByText('Sua sessão expirou. Entre novamente.')).toHaveLength(1)
    expect(falsa.total()).toBe(requisicoesAntes + 3)
  })

  it('não avisa a expiração quando já não há usuário', async () => {
    await montar({ [CHECAR]: { status: 401 }, 'GET /insumos': { status: 401 } })

    await act(async () => {
      await api.get('/insumos').catch(() => {})
    })

    expect(regiaoDeErros()).toBeEmptyDOMElement()
  })

  it('useSessao falha com mensagem clara fora do provider', () => {
    function SemProvider() {
      useSessao()
      return null
    }

    expect(() => render(<SemProvider />)).toThrow('useSessao must be used within SessaoProvider')
  })
})
