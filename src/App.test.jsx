import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import ToastProvider from './components/feedback/ToastProvider'
import SessaoProvider from './components/sessao/SessaoProvider'
import api from './services/api'
import instalarApiFalsa, { FALHA_DE_REDE } from './test/apiFalsa'

vi.mock('./app/pages/Agenda', () => ({ default: () => <h1>Tela Agenda</h1> }))
vi.mock('./app/pages/Estoque', () => ({ default: () => <h1>Tela Estoque</h1> }))
vi.mock('./app/pages/Pedido', () => ({ default: () => null }))
vi.mock('./app/pages/VisaoGeral', () => ({ default: () => null }))
vi.mock('./app/pages/Produtos', () => ({ default: () => null }))
vi.mock('./app/pages/Clientes', () => ({ default: () => null }))
vi.mock('./app/pages/Producao', () => ({ default: () => null }))
vi.mock('./app/pages/HistoricoPedidos', () => ({ default: () => null }))

class FakeEventSource {
  static instancias = []
  constructor(url, opcoes) {
    this.url = url
    this.opcoes = opcoes
    this.fechada = false
    FakeEventSource.instancias.push(this)
  }
  addEventListener() {}
  close() {
    this.fechada = true
  }
}

const ME = 'GET /usuarios/me'
const LOGIN = 'POST /usuarios/login'
const LOGOUT = 'POST /usuarios/logout'
const COM_SESSAO = { status: 200, data: { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com' } }

function abrirApp(rotas) {
  const falsa = instalarApiFalsa({ 'GET /notificacoes/nao-lidas': { status: 200, data: [] }, ...rotas })
  render(
    <ToastProvider>
      <SessaoProvider>
        <App />
      </SessaoProvider>
    </ToastProvider>,
  )
  return falsa
}

function abrirSemSessaoQueAceitaLogin() {
  const falsa = abrirApp({
    [ME]: { status: 401 },
    [LOGIN]: () => {
      falsa.rotas[ME] = COM_SESSAO
      return { status: 200, data: {} }
    },
    [LOGOUT]: () => {
      falsa.rotas[ME] = { status: 401 }
      return { status: 204 }
    },
  })
  return falsa
}

function entrarComCredenciais() {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'dona@exemplo.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-ficticia' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar no sistema' }))
}

// The focus moves in an effect, which may run after the login screen is already in the document.
async function focoNoEmail() {
  const campo = await screen.findByLabelText('E-mail')
  await waitFor(() => expect(campo).toHaveFocus())
}

async function fonteDoStream() {
  await waitFor(() => expect(FakeEventSource.instancias).toHaveLength(1))
  return FakeEventSource.instancias[0]
}

describe('App - sessão', () => {
  beforeEach(() => {
    FakeEventSource.instancias = []
    vi.stubGlobal('EventSource', FakeEventSource)
  })

  it('mantém a sessão no reload', async () => {
    abrirApp({ [ME]: COM_SESSAO })

    expect(screen.getByText('Verificando sessão...')).toBeInTheDocument()
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Tela Agenda' })).toBeInTheDocument()
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument()
  })

  it.each([
    ['401', { status: 401 }],
    ['falha de rede', FALHA_DE_REDE],
  ])('mostra o login sem aviso quando a checagem termina em %s', async (_caso, resposta) => {
    abrirApp({ [ME]: resposta })

    await focoNoEmail()
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('mostra o shell depois do login', async () => {
    const falsa = abrirSemSessaoQueAceitaLogin()
    await screen.findByLabelText('E-mail')

    entrarComCredenciais()

    expect(await screen.findByRole('heading', { name: 'Tela Agenda' })).toBeInTheDocument()
    expect(screen.getByText('Dona Exemplo')).toBeInTheDocument()
    expect(falsa.chamadasDe(LOGIN)).toHaveLength(1)
    expect(falsa.chamadasDe(ME)).toHaveLength(2)
  })

  it('abre o stream só com sessão', async () => {
    abrirSemSessaoQueAceitaLogin()

    expect(screen.getByText('Verificando sessão...')).toBeInTheDocument()
    expect(FakeEventSource.instancias).toHaveLength(0)

    await screen.findByLabelText('E-mail')
    expect(FakeEventSource.instancias).toHaveLength(0)

    entrarComCredenciais()
    await screen.findByRole('heading', { name: 'Tela Agenda' })

    const fonte = await fonteDoStream()
    expect(fonte.url).toContain('/notificacoes/stream')
    expect(fonte.opcoes).toEqual({ withCredentials: true })
  })

  it('sai e fecha o stream de notificações', async () => {
    const falsa = abrirApp({ [ME]: COM_SESSAO, [LOGOUT]: { status: 204 } })
    await screen.findByRole('heading', { name: 'Tela Agenda' })
    const fonte = await fonteDoStream()
    expect(fonte.fechada).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    await focoNoEmail()
    expect(falsa.chamadasDe(LOGOUT)).toHaveLength(1)
    expect(fonte.fechada).toBe(true)
  })

  it('continua no shell quando sair falha', async () => {
    abrirApp({ [ME]: COM_SESSAO, [LOGOUT]: FALHA_DE_REDE })
    await screen.findByRole('heading', { name: 'Tela Agenda' })

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByText('Não foi possível sair. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tela Agenda' })).toBeInTheDocument()
    expect((await fonteDoStream()).fechada).toBe(false)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sair' })).toBeEnabled())
  })

  it('volta à Agenda depois de sair', async () => {
    abrirSemSessaoQueAceitaLogin()
    await screen.findByLabelText('E-mail')
    entrarComCredenciais()
    await screen.findByRole('heading', { name: 'Tela Agenda' })

    fireEvent.click(screen.getByRole('button', { name: 'Estoque' }))
    expect(screen.getByRole('heading', { name: 'Tela Estoque' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    await screen.findByLabelText('E-mail')

    entrarComCredenciais()

    expect(await screen.findByRole('heading', { name: 'Tela Agenda' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tela Estoque' })).not.toBeInTheDocument()
  })

  it('volta ao login com um aviso quando a sessão expira e fecha o stream', async () => {
    abrirApp({ [ME]: COM_SESSAO, 'GET /insumos': { status: 401 } })
    await screen.findByRole('heading', { name: 'Tela Agenda' })
    const fonte = await fonteDoStream()

    await act(async () => {
      await api.get('/insumos').catch(() => {})
    })

    await focoNoEmail()
    expect(screen.getAllByText('Sua sessão expirou. Entre novamente.')).toHaveLength(1)
    expect(fonte.fechada).toBe(true)
  })
})
