import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import Clientes from './Clientes'
import api from '../../services/api'
import { buscarEndereco } from '../../services/cep'
import renderComToast from '../../test/renderComToast'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))
vi.mock('../../services/cep', () => ({
  buscarEndereco: vi.fn(),
  ERRO_CEP: {
    INVALIDO: 'CEP_INVALIDO',
    NAO_ENCONTRADO: 'CEP_NAO_ENCONTRADO',
    INDISPONIVEL: 'SERVICO_INDISPONIVEL',
  },
}))

const EXEMPLO = {
  idCliente: 1,
  nome: 'Cliente Exemplo',
  telefone: '+55 11 90000-0001',
  endereco: 'Praça da Sé, 100, Sé, São Paulo - SP',
  cep: '01001000',
  tipoPessoa: 'FISICA',
  classificacaoCliente: 'PADRAO',
  status: 'ATIVO',
  observacao: null,
  totalPedidos: 3,
  gastoTotal: 90,
  ultimoPedido: '2026-10-28',
}
const OUTRA = { ...EXEMPLO, idCliente: 2, nome: 'Outra Pessoa', cep: null, totalPedidos: 1 }

function responder({ resumo = [EXEMPLO, OUTRA] } = {}) {
  api.get.mockImplementation((url, config) => {
    if (url === '/clientes/resumo') {
      const busca = config?.params?.busca
      const lista = busca
        ? resumo.filter((cliente) => cliente.nome.toLowerCase().includes(busca.toLowerCase()))
        : resumo
      return Promise.resolve({ data: lista })
    }
    if (url === '/produtos') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`Rota inesperada: ${url}`))
  })
}

const chamadasA = (url) => api.get.mock.calls.filter(([rota]) => rota === url)

async function abrirNovoCliente() {
  renderComToast(<Clientes />)
  await screen.findByText('Cliente Exemplo')
  fireEvent.click(screen.getByRole('button', { name: /Novo Cliente/ }))
}

function preencherObrigatorios() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Cliente Novo' } })
  fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '+55 11 90000-0002' } })
  fireEvent.change(screen.getByLabelText(/^Endereço/), { target: { value: 'Rua Exemplo, 10' } })
}

describe('Clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    responder()
  })

  it('abre sem baixar pedidos', async () => {
    renderComToast(<Clientes />)

    expect(screen.getByText('Carregando clientes...')).toBeInTheDocument()
    expect(await screen.findByText('Cliente Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Outra Pessoa')).toBeInTheDocument()
    expect(chamadasA('/clientes/resumo')).toHaveLength(1)
    expect(chamadasA('/pedidos')).toHaveLength(0)
    expect(chamadasA('/itens-pedido')).toHaveLength(0)
    expect(screen.getByText('Pedidos totais').nextSibling).toHaveTextContent('4')
  })

  it('busca cliente por nome no servidor', async () => {
    renderComToast(<Clientes />)
    await screen.findByText('Cliente Exemplo')
    const campo = screen.getByLabelText('Buscar cliente por nome ou telefone')

    fireEvent.change(campo, { target: { value: 'e' } })
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(chamadasA('/clientes/resumo')).toHaveLength(1)

    fireEvent.change(campo, { target: { value: 'exe' } })

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/clientes/resumo', { params: { busca: 'exe' } })
    )
    await waitFor(() => expect(screen.queryByText('Outra Pessoa')).not.toBeInTheDocument())
    expect(screen.getByText('Cliente Exemplo')).toBeInTheDocument()

    fireEvent.change(campo, { target: { value: '' } })
    expect(await screen.findByText('Outra Pessoa')).toBeInTheDocument()
  })

  it('mostra o estado vazio quando a busca não acha ninguém', async () => {
    responder({ resumo: [] })
    renderComToast(<Clientes />)

    expect(await screen.findByText('Nenhum cliente encontrado.')).toBeInTheDocument()
  })

  it('mostra o erro de carregamento', async () => {
    api.get.mockRejectedValue(new Error('falha'))
    renderComToast(<Clientes />)

    expect(await screen.findByText(/Não foi possível carregar os clientes/)).toBeInTheDocument()
    expect(screen.queryByText('Nenhum cliente encontrado.')).not.toBeInTheDocument()
  })

  it('CEP preenche o endereço do cliente', async () => {
    buscarEndereco.mockResolvedValue({
      rua: 'Praça da Sé',
      bairro: 'Sé',
      cidade: 'São Paulo',
      uf: 'SP',
    })
    await abrirNovoCliente()

    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01001000' } })

    const endereco = screen.getByLabelText(/^Endereço/)
    await waitFor(() => expect(endereco).toHaveValue('Praça da Sé, Sé, São Paulo - SP'))
    expect(endereco).toHaveFocus()
    expect(endereco).toHaveAccessibleDescription('Complete com o número e o complemento.')
  })

  it('avisa ao salvar', async () => {
    api.post.mockResolvedValue({ data: {} })
    await abrirNovoCliente()
    preencherObrigatorios()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    expect(await screen.findByText('Cliente salvo.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Novo cliente' })).not.toBeInTheDocument()
    await waitFor(() => expect(chamadasA('/clientes/resumo')).toHaveLength(2))
  })

  it('mantém o modal aberto e mostra a mensagem da API quando salvar falha', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Telefone já cadastrado.' } } })
    await abrirNovoCliente()
    preencherObrigatorios()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    expect(await screen.findByText('Telefone já cadastrado.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Novo cliente' })).toBeInTheDocument()
  })

  it('envia o cep do cliente', async () => {
    api.post.mockResolvedValue({ data: {} })
    await abrirNovoCliente()
    preencherObrigatorios()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
    expect(api.post.mock.calls[0][1]).toMatchObject({ cep: null })

    fireEvent.click(await screen.findByRole('button', { name: /Novo Cliente/ }))
    preencherObrigatorios()
    buscarEndereco.mockResolvedValue({ rua: '', bairro: '', cidade: '', uf: '' })
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01001000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
    expect(api.post.mock.calls[1][1]).toMatchObject({ cep: '01001000' })
  })

  it('carrega o cep gravado na edição e envia a alteração com PUT', async () => {
    api.put.mockResolvedValue({ data: {} })
    renderComToast(<Clientes />)
    await screen.findByText('Cliente Exemplo')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Cliente Exemplo' }))

    expect(screen.getByLabelText('CEP')).toHaveValue('01001-000')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
    expect(api.put.mock.calls[0][0]).toBe('/clientes/1')
    expect(api.put.mock.calls[0][1]).toMatchObject({ cep: '01001000', nome: 'Cliente Exemplo' })
    expect(api.put.mock.calls[0][1]).not.toHaveProperty('totalPedidos')
  })

  it('não salva com CEP incompleto', async () => {
    await abrirNovoCliente()
    preencherObrigatorios()
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '0100' } })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }))

    expect(await screen.findByText('Informe os 8 dígitos do CEP ou deixe o campo vazio.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
