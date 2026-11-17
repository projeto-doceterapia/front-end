import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import Pedido from './Pedido'
import api from '../../services/api'
import { buscarEndereco, ERRO_CEP } from '../../services/cep'

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../../services/cep', () => ({
  buscarEndereco: vi.fn(),
  ERRO_CEP: { INVALIDO: 'INVALIDO', NAO_ENCONTRADO: 'NAO_ENCONTRADO', INDISPONIVEL: 'INDISPONIVEL' },
}))

const CLIENTES = [
  { idCliente: 1, nome: 'Cliente Exemplo', status: 'ATIVO', telefone: '+55 11 90000-0001', endereco: 'Rua Exemplo, 10, Centro, São Paulo - SP', cep: '01001000' },
  { idCliente: 2, nome: 'Cliente Inativo', status: 'INATIVO' },
  { idCliente: 3, nome: 'Outra Cliente', status: 'ATIVO', endereco: 'Avenida Teste, 20' },
]
const PRODUTOS = [{ idProduto: 9, nome: 'Bolo de cenoura', precoAtual: 40, status: 'ATIVO', categoriaNome: 'Bolos' }]
const SE = { rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' }

function prepararApi(buscas = {}) {
  api.get.mockImplementation((url, config) => {
    const busca = config?.params?.busca
    if (busca) return buscas[busca] ? buscas[busca]() : Promise.resolve({ data: [] })
    return Promise.resolve({ data: url === '/clientes' ? CLIENTES : PRODUTOS })
  })
  api.post.mockImplementation((url) => Promise.resolve({ data: url === '/pedidos' ? { idPedido: 42 } : {} }))
}

async function renderizar() {
  render(<Pedido onBack={vi.fn()} />)
  await screen.findByRole('option', { name: 'Cliente Exemplo' })
}

function escolherCliente(id) {
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { name: 'clienteId', value: id } })
}

function escolherEntrega() {
  fireEvent.change(screen.getByLabelText('Forma de entrega'), { target: { name: 'formaEntrega', value: 'ENTREGA' } })
}

function informarData() {
  fireEvent.change(screen.getByLabelText('Data de entrega'), { target: { name: 'dataEntrega', value: '2026-11-20' } })
}

async function salvarComUmItem() {
  fireEvent.click(screen.getByRole('button', { name: 'Próximo - Itens' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Adicionar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próximo - Pagamento' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }))
}

function enderecoEntrega() {
  return screen.getByLabelText('Endereço de entrega')
}

describe('Pedido', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('lista só clientes ativos para escolher', async () => {
    prepararApi()
    await renderizar()
    expect(screen.queryByRole('option', { name: 'Cliente Inativo' })).not.toBeInTheDocument()
  })

  it('CEP preenche o endereço de entrega', async () => {
    prepararApi()
    buscarEndereco.mockResolvedValue(SE)
    await renderizar()
    escolherEntrega()

    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01001-000' } })

    await waitFor(() => expect(enderecoEntrega()).toHaveValue('Praça da Sé, Sé, São Paulo - SP'))
    expect(buscarEndereco).toHaveBeenCalledWith('01001000')
    expect(enderecoEntrega()).toHaveFocus()
    expect(enderecoEntrega()).toHaveAccessibleDescription('Complete com o número e o complemento.')
  })

  it('falha do CEP mantém preenchimento manual', async () => {
    prepararApi()
    buscarEndereco.mockRejectedValue(Object.assign(new Error('cep'), { codigo: ERRO_CEP.NAO_ENCONTRADO }))
    await renderizar()
    escolherCliente('3')
    informarData()
    escolherEntrega()
    fireEvent.change(enderecoEntrega(), { target: { name: 'enderecoEntrega', value: 'Rua Digitada, 5' } })

    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '99999999' } })

    expect(await screen.findByText('CEP não encontrado. Digite o endereço manualmente.')).toBeInTheDocument()
    expect(enderecoEntrega()).toHaveValue('Rua Digitada, 5')
    expect(enderecoEntrega()).not.toBeDisabled()
    await salvarComUmItem()
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/pedidos', expect.objectContaining({ enderecoEntrega: 'Rua Digitada, 5' })))
  })

  it('envia o cep do pedido', async () => {
    prepararApi()
    buscarEndereco.mockResolvedValue(SE)
    await renderizar()
    escolherCliente('3')
    informarData()
    escolherEntrega()
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01001000' } })
    await waitFor(() => expect(enderecoEntrega()).toHaveValue('Praça da Sé, Sé, São Paulo - SP'))
    fireEvent.change(enderecoEntrega(), { target: { name: 'enderecoEntrega', value: 'Praça da Sé, 100, Sé, São Paulo - SP' } })

    await salvarComUmItem()

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/pedidos', expect.objectContaining({
      formaEntrega: 'ENTREGA',
      enderecoEntrega: 'Praça da Sé, 100, Sé, São Paulo - SP',
      cep: '01001000',
    })))
  })

  it('retirada envia cep e endereço nulos', async () => {
    prepararApi()
    await renderizar()
    escolherCliente('1')
    informarData()

    await salvarComUmItem()

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/pedidos', expect.objectContaining({ formaEntrega: 'RETIRADA', enderecoEntrega: null, cep: null })))
  })

  it('sugere o endereço do cliente', async () => {
    prepararApi()
    await renderizar()
    escolherCliente('1')
    escolherEntrega()

    expect(enderecoEntrega()).toHaveValue('Rua Exemplo, 10, Centro, São Paulo - SP')
    expect(screen.getByLabelText('CEP')).toHaveValue('01001-000')
    expect(screen.getByText('Endereço do cadastro do cliente. Alterar aqui vale só para este pedido.')).toBeInTheDocument()

    escolherCliente('3')
    expect(enderecoEntrega()).toHaveValue('Avenida Teste, 20')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('não sobrescreve endereço editado', async () => {
    prepararApi()
    await renderizar()
    escolherCliente('1')
    escolherEntrega()
    fireEvent.change(enderecoEntrega(), { target: { name: 'enderecoEntrega', value: 'Rua Editada, 1' } })

    escolherCliente('3')

    expect(enderecoEntrega()).toHaveValue('Rua Editada, 1')
    fireEvent.click(screen.getByRole('button', { name: 'Usar endereço do cadastro' }))
    expect(enderecoEntrega()).toHaveValue('Avenida Teste, 20')
  })

  it('busca cliente por nome', async () => {
    let responder
    prepararApi({ exe: () => new Promise((resolve) => { responder = resolve }) })
    await renderizar()
    vi.useFakeTimers()

    fireEvent.change(screen.getByLabelText('Buscar cliente por nome ou telefone'), { target: { value: 'exe' } })
    await act(async () => { vi.advanceTimersByTime(300) })

    expect(api.get).toHaveBeenCalledWith('/clientes', { params: { busca: 'exe' } })
    expect(screen.getByText('Buscando clientes...')).toBeInTheDocument()
    await act(async () => { responder({ data: [CLIENTES[0]] }) })

    expect(screen.getByRole('option', { name: 'Cliente Exemplo' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Outra Cliente' })).not.toBeInTheDocument()
  })

  it('busca sem resultado e com erro mantém a lista anterior', async () => {
    prepararApi({ zzz: () => Promise.resolve({ data: [] }), err: () => Promise.reject(new Error('rede')) })
    await renderizar()
    vi.useFakeTimers()
    const campo = screen.getByLabelText('Buscar cliente por nome ou telefone')

    fireEvent.change(campo, { target: { value: 'zzz' } })
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(screen.getByText('Nenhum cliente encontrado.')).toBeInTheDocument()

    fireEvent.change(campo, { target: { value: 'err' } })
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(screen.getByText('Não foi possível buscar clientes.')).toBeInTheDocument()

    fireEvent.change(campo, { target: { value: '' } })
    expect(screen.getByRole('option', { name: 'Outra Cliente' })).toBeInTheDocument()
  })
})
