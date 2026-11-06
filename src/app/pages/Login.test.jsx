import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Login from './Login'
import ToastProvider from '../../components/feedback/ToastProvider'
import SessaoProvider from '../../components/sessao/SessaoProvider'
import useSessao from '../../components/sessao/useSessao'
import instalarApiFalsa, { FALHA_DE_REDE } from '../../test/apiFalsa'

const ME = 'GET /usuarios/me'
const LOGIN = 'POST /usuarios/login'
const DONA = { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com' }

function UsuarioAtual() {
  const { usuario, carregando } = useSessao()
  if (carregando) return null
  return <output>{usuario ? usuario.nome : 'sem usuário'}</output>
}

async function abrirLogin(rotas) {
  const falsa = instalarApiFalsa({ [ME]: { status: 401 }, ...rotas })
  render(
    <ToastProvider>
      <SessaoProvider>
        <UsuarioAtual />
        <Login />
      </SessaoProvider>
    </ToastProvider>,
  )
  await screen.findByText('sem usuário')
  return falsa
}

function enviar(email = 'dona@exemplo.com', senha = 'senha-ficticia') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar no sistema' }))
}

describe('Login', () => {
  it('entra com credenciais válidas', async () => {
    const falsa = await abrirLogin({
      [LOGIN]: () => {
        falsa.rotas[ME] = { status: 200, data: DONA }
        return { status: 200, data: { userId: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com', token: 'jwt-ficticio' } }
      },
    })

    enviar()

    expect(await screen.findByText('Dona Exemplo')).toBeInTheDocument()
    expect(JSON.parse(falsa.chamadasDe(LOGIN)[0].corpo)).toEqual({ email: 'dona@exemplo.com', senha: 'senha-ficticia' })
    expect(falsa.chamadasDe(ME)).toHaveLength(2)
  })

  it('mostra erro com credenciais inválidas', async () => {
    const falsa = await abrirLogin({ [LOGIN]: { status: 401 } })

    enviar()

    const aviso = await screen.findByText('E-mail ou senha inválidos. Tente novamente.')
    expect(aviso.closest('[role="alert"]')).toBeInTheDocument()
    expect(screen.getByText('sem usuário')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('dona@exemplo.com')
    expect(falsa.chamadasDe(ME)).toHaveLength(1)
  })

  it('trata outro 4xx como credenciais inválidas', async () => {
    await abrirLogin({ [LOGIN]: { status: 400 } })

    enviar()

    expect(await screen.findByText('E-mail ou senha inválidos. Tente novamente.')).toBeInTheDocument()
  })

  it.each([
    ['a rede falha', FALHA_DE_REDE],
    ['o servidor responde 500', { status: 500 }],
  ])('mostra erro quando o servidor está fora: %s', async (_caso, resposta) => {
    await abrirLogin({ [LOGIN]: resposta })

    enviar()

    expect(await screen.findByText('Não foi possível entrar agora. Tente novamente em instantes.')).toBeInTheDocument()
  })

  it('fica no login quando /usuarios/me falha logo depois de entrar', async () => {
    await abrirLogin({ [LOGIN]: { status: 200, data: {} } })

    enviar()

    expect(await screen.findByText('Não foi possível iniciar a sessão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByText('sem usuário')).toBeInTheDocument()
  })

  it('libera o botão depois de um erro', async () => {
    await abrirLogin({ [LOGIN]: { status: 401 } })

    enviar()

    await screen.findByText('E-mail ou senha inválidos. Tente novamente.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar no sistema' })).toBeEnabled())
  })

  it('valida campos vazios na própria tela, sem chamar o servidor', async () => {
    const falsa = await abrirLogin({})

    fireEvent.click(screen.getByRole('button', { name: 'Entrar no sistema' }))

    expect(screen.getByText('Preencha e-mail e senha para continuar.')).toBeInTheDocument()
    expect(falsa.chamadasDe(LOGIN)).toHaveLength(0)
  })

  it('não mostra o aviso de protótipo', async () => {
    await abrirLogin({})

    expect(screen.queryByText(/Use qualquer e-mail e senha/)).not.toBeInTheDocument()
    expect(screen.queryByText(/protótipo/)).not.toBeInTheDocument()
  })

  it('abre com o foco no campo de e-mail', async () => {
    await abrirLogin({})

    await waitFor(() => expect(screen.getByLabelText('E-mail')).toHaveFocus())
  })
})
