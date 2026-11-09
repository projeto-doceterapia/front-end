import { describe, expect, it } from 'vitest'
import {
  formatarMoeda,
  formatarPercentual,
  formatarQuantidade,
  margemParaEnvio,
  mensagemErroProduto,
  precoAbaixoDoSugerido,
  unidadesCompativeis,
} from './precificacaoUtils'

function erroHttp(status, data) {
  return { response: { status, data } }
}

describe('unidades compatíveis', () => {
  it('oferece só a unidade do insumo contado por unidade', () => {
    expect(unidadesCompativeis('UNIDADE')).toEqual(['UNIDADE'])
  })

  it('oferece a unidade e a menor ou maior da mesma grandeza', () => {
    expect(unidadesCompativeis('KG')).toEqual(['KG', 'G'])
    expect(unidadesCompativeis('G')).toEqual(['KG', 'G'])
    expect(unidadesCompativeis('L')).toEqual(['L', 'ML'])
    expect(unidadesCompativeis('ML')).toEqual(['L', 'ML'])
  })

  it('não oferece nada para uma unidade desconhecida', () => {
    expect(unidadesCompativeis('XX')).toEqual([])
  })
})

describe('formatarQuantidade', () => {
  it('usa a unidade gravada na linha, sem converter', () => {
    expect(formatarQuantidade({ quantidadeUtilizada: 500, unidade: 'G' })).toBe('500 g')
    expect(formatarQuantidade({ quantidadeUtilizada: 0.25, unidade: 'KG' })).toBe('0,25 kg')
    expect(formatarQuantidade({ quantidadeUtilizada: 1, unidade: 'UNIDADE' })).toBe('1 un.')
    expect(formatarQuantidade({ quantidadeUtilizada: 0.2, unidade: 'L' })).toBe('0,2 L')
  })
})

describe('formatarMoeda e formatarPercentual', () => {
  it('formata em reais e mostra traço quando não há valor', () => {
    expect(formatarMoeda(7.84)).toMatch(/^R\$\s7,84$/)
    expect(formatarMoeda(null)).toBe('—')
    expect(formatarMoeda(undefined)).toBe('—')
  })

  it('formata o percentual sem zeros sobrando', () => {
    expect(formatarPercentual(120)).toBe('120%')
    expect(formatarPercentual('62.5')).toBe('62,5%')
  })
})

describe('margemParaEnvio', () => {
  it('envia null quando o campo está vazio', () => {
    expect(margemParaEnvio('')).toBeNull()
    expect(margemParaEnvio('  ')).toBeNull()
    expect(margemParaEnvio(null)).toBeNull()
  })

  it('envia o número, aceitando vírgula e zero', () => {
    expect(margemParaEnvio('120')).toBe(120)
    expect(margemParaEnvio('62,5')).toBe(62.5)
    expect(margemParaEnvio('0')).toBe(0)
  })
})

describe('precoAbaixoDoSugerido', () => {
  it('é verdadeiro só quando o preço atual é menor que o sugerido', () => {
    expect(precoAbaixoDoSugerido({ precoAtual: 15, precoSugerido: 16 })).toBe(true)
    expect(precoAbaixoDoSugerido({ precoAtual: 16, precoSugerido: 16 })).toBe(false)
    expect(precoAbaixoDoSugerido({ precoAtual: 20, precoSugerido: 16 })).toBe(false)
  })

  it('é falso quando falta um dos preços', () => {
    expect(precoAbaixoDoSugerido({ precoAtual: 15, precoSugerido: null })).toBe(false)
    expect(precoAbaixoDoSugerido({ precoAtual: null, precoSugerido: 16 })).toBe(false)
  })
})

describe('mensagemErroProduto', () => {
  it('prefere a mensagem do corpo da resposta', () => {
    const erro = erroHttp(422, { message: 'Unidade G é incompatível com a unidade UNIDADE do insumo' })
    expect(mensagemErroProduto(erro)).toBe('Unidade G é incompatível com a unidade UNIDADE do insumo')
  })

  it('cai no texto por status quando o corpo não traz mensagem', () => {
    expect(mensagemErroProduto(erroHttp(422, ''))).toBe('A unidade escolhida não combina com a unidade do insumo.')
    expect(mensagemErroProduto(erroHttp(400, {}))).toBe('Confira os campos informados.')
    expect(mensagemErroProduto(erroHttp(403, null))).toBe('Seu perfil não pode alterar preços nem a ficha técnica.')
    expect(mensagemErroProduto(erroHttp(404, null))).toBe('Produto ou insumo não encontrado. Atualize a tela.')
  })

  it('usa o texto padrão informado para o conflito', () => {
    expect(mensagemErroProduto(erroHttp(409, null), 'Este insumo já está na ficha técnica.'))
      .toBe('Este insumo já está na ficha técnica.')
  })

  it('trata erro de servidor e falta de resposta como falha de conexão', () => {
    const texto = 'Não foi possível falar com o servidor. Tente novamente.'
    expect(mensagemErroProduto(erroHttp(500, null))).toBe(texto)
    expect(mensagemErroProduto({})).toBe(texto)
  })
})
