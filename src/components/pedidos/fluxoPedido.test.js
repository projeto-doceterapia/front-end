import { describe, expect, it } from 'vitest'
import { mensagemErro, podeCancelar, precisaConfirmar, proximaFase, PROXIMA_FASE } from './fluxoPedido'
import { STATUS_PAGAMENTO, STATUS_PEDIDO, textoStatusPagamento, valorPago } from './pedidoUtils'

describe('fluxoPedido', () => {
  it('fases finais sem próxima fase', () => {
    expect(proximaFase('ENTREGUE')).toBeNull()
    expect(proximaFase('CANCELADO')).toBeNull()
    expect(proximaFase('AGUARDANDO_SINAL')).toBeNull()
    expect(PROXIMA_FASE).toEqual({
      ORCAMENTO: 'AGUARDANDO_SINAL',
      ESPERANDO_FAZER: 'EM_PRODUCAO',
      EM_PRODUCAO: 'AGUARDANDO_ENTREGA',
      AGUARDANDO_ENTREGA: 'ENTREGUE',
    })
  })

  it('confirma só ao iniciar produção e ao entregar', () => {
    expect(precisaConfirmar('ESPERANDO_FAZER')).toBe(true)
    expect(precisaConfirmar('AGUARDANDO_ENTREGA')).toBe(true)
    expect(precisaConfirmar('ORCAMENTO')).toBe(false)
    expect(precisaConfirmar('EM_PRODUCAO')).toBe(false)
  })

  it('cancela só pedidos não finalizados', () => {
    expect(podeCancelar('EM_PRODUCAO')).toBe(true)
    expect(podeCancelar('ENTREGUE')).toBe(false)
    expect(podeCancelar('CANCELADO')).toBe(false)
  })

  it('mensagemErro usa message e cai no padrão', () => {
    expect(mensagemErro({ response: { status: 409, data: { message: 'Transição não permitida' } } })).toBe('Transição não permitida')
    expect(mensagemErro({ response: { status: 409, data: {} } })).toBe('O pedido mudou ou já foi cancelado. Atualize a tela.')
    expect(mensagemErro({ response: { status: 422, data: { message: '  ' } } })).toBe('A regra do pedido impediu a ação.')
    expect(mensagemErro({ response: { status: 400 } })).toBe('Essa mudança não é permitida para o pedido.')
    expect(mensagemErro({ response: { status: 403 } })).toBe('Seu perfil não pode fazer esta ação.')
    expect(mensagemErro({ response: { status: 404 } })).toBe('Pedido não encontrado. Atualize a tela.')
    expect(mensagemErro(new Error('Network Error'))).toBe('Não foi possível falar com o servidor. Tente novamente.')
  })

  it('rótulos alinhados ao enum', () => {
    expect(Object.keys(STATUS_PEDIDO)).toEqual(['ORCAMENTO', 'AGUARDANDO_SINAL', 'ESPERANDO_FAZER', 'EM_PRODUCAO', 'AGUARDANDO_ENTREGA', 'ENTREGUE', 'CANCELADO'])
    expect(Object.keys(STATUS_PAGAMENTO)).toEqual(['AGUARDANDO_SINAL', 'AGUARDANDO_PAGAMENTO', 'PAGO_INTEGRAL'])
    expect(textoStatusPagamento('PAGO_INTEGRAL')).toBe('Pago')
    expect(textoStatusPagamento(undefined)).toBe('Pagamento pendente')
    expect(valorPago({ statusPagamento: 'AGUARDANDO_PAGAMENTO', valorSinal: 40, valorTotal: 80 })).toBe(40)
    expect(valorPago({ statusPagamento: 'PAGO_INTEGRAL', valorSinal: 40, valorTotal: 80 })).toBe(80)
  })
})
