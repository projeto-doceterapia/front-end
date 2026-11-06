import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import GerenciarUsuarios from './GerenciarUsuarios'
import api from '../../services/api'
import renderComToast from '../../test/renderComToast'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const DONA = { id: 1, nome: 'Dona Exemplo', email: 'dona@exemplo.com', perfil: 'DONA' }
const AJUDANTE = { id: 2, nome: 'Ajudante Exemplo', email: 'ajudante@exemplo.com', perfil: 'FUNCIONARIA' }

function preencher({ nome = 'Ajudante Exemplo', email = 'ajudante@exemplo.com', senha = 'senha-ficticia-1' } = {}) {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: nome } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: senha } })
}

describe('GerenciarUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o carregamento e depois a lista com o perfil de cada usuário', async () => {
    api.get.mockResolvedValueOnce({ status: 200, data: [DONA, AJUDANTE] })
    renderComToast(<GerenciarUsuarios aoFechar={vi.fn()} />)

    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('Carregando usuários...')
    const lista = await screen.findByRole('list')
    expect(within(lista).getByText('Dona Exemplo')).toBeInTheDocument()
    expect(within(lista).getByText('ajudante@exemplo.com')).toBeInTheDocument()
    expect(within(lista).getByText('Dona')).toBeInTheDocument()
    expect(within(lista).getByText('Funcionária')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/usuarios')
  })

  it('mostra o estado vazio quando a API responde 204', async () => {
    api.get.mockResolvedValueOnce({ status: 204, data: '' })
    renderComToast(<GerenciarUsuarios aoFechar={vi.fn()} />)

    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeInTheDocument()
  })

  it('mostra o erro em role alert quando a lista falha', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'))
    renderComToast(<GerenciarUsuarios aoFechar={vi.fn()} />)

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Não foi possível carregar os usuários.')
  })

  it('cria uma FUNCIONARIA, avisa com toast e recarrega a lista', async () => {
    api.get
      .mockResolvedValueOnce({ status: 200, data: [DONA] })
      .mockResolvedValueOnce({ status: 200, data: [DONA, AJUDANTE] })
    api.post.mockResolvedValueOnce({ status: 201, data: '' })
    renderComToast(<GerenciarUsuarios aoFechar={vi.fn()} />)
    await screen.findByRole('list')

    expect(screen.getByLabelText('Perfil')).toHaveValue('FUNCIONARIA')
    preencher()
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/usuarios', {
      nome: 'Ajudante Exemplo',
      email: 'ajudante@exemplo.com',
      senha: 'senha-ficticia-1',
      perfil: 'FUNCIONARIA',
    }))
    expect(await screen.findByText('Usuário criado.')).toBeInTheDocument()
    expect(await within(await screen.findByRole('list')).findByText('ajudante@exemplo.com')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Nome')).toHaveValue('')
  })

  it('mostra a mensagem do servidor quando o e-mail já existe (409)', async () => {
    api.get.mockResolvedValueOnce({ status: 200, data: [DONA] })
    api.post.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Já existe um usuário com este e-mail.' } } })
    renderComToast(<GerenciarUsuarios aoFechar={vi.fn()} />)
    await screen.findByRole('list')

    preencher({ email: 'dona@exemplo.com' })
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Já existe um usuário com este e-mail.')
    expect(screen.getByLabelText('E-mail')).toHaveValue('dona@exemplo.com')
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('fecha com Esc e pelo botão Fechar', async () => {
    api.get.mockResolvedValue({ status: 200, data: [DONA] })
    const aoFechar = vi.fn()
    renderComToast(<GerenciarUsuarios aoFechar={aoFechar} />)
    await screen.findByRole('list')

    const dialogo = screen.getByRole('dialog', { name: 'Usuários' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(dialogo, { key: 'Escape' })
    expect(aoFechar).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar' })[0])
    expect(aoFechar).toHaveBeenCalledTimes(2)
  })
})
