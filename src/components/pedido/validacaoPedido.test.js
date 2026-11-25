import { describe, it, expect } from 'vitest'
import { errosClienteEntrega } from './validacaoPedido'

const HOJE = new Date(2026, 10, 25)
const DADOS = { clienteId: '1', dataEntrega: '2026-11-26', formaEntrega: 'RETIRADA', enderecoEntrega: '' }
const NOVO = { nome: '', telefone: '', endereco: '' }

describe('errosClienteEntrega', () => {
  it('aceita cliente cadastrado com data futura', () => {
    expect(errosClienteEntrega({ tipoCliente: 'existente', dados: DADOS, novoCliente: NOVO }, HOJE)).toEqual({})
  })

  it('explica cada campo que falta', () => {
    const erros = errosClienteEntrega({ tipoCliente: 'novo', dados: { ...DADOS, dataEntrega: '', formaEntrega: 'ENTREGA' }, novoCliente: NOVO }, HOJE)

    expect(Object.keys(erros)).toEqual(['nome', 'telefone', 'endereco', 'dataEntrega', 'enderecoEntrega'])
  })

  it('recusa data no passado e aceita hoje', () => {
    const passado = errosClienteEntrega({ tipoCliente: 'existente', dados: { ...DADOS, dataEntrega: '2026-11-24' }, novoCliente: NOVO }, HOJE)
    const hoje = errosClienteEntrega({ tipoCliente: 'existente', dados: { ...DADOS, dataEntrega: '2026-11-25' }, novoCliente: NOVO }, HOJE)

    expect(passado.dataEntrega).toBe('Escolha uma data de hoje em diante.')
    expect(hoje).toEqual({})
  })
})
