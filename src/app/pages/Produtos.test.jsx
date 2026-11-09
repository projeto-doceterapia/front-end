import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import Produtos from './Produtos'
import useSessao from '../../components/sessao/useSessao'
import renderComToast from '../../test/renderComToast'
import instalarApiFalsa, { FALHA_DE_REDE } from '../../test/apiFalsa'

vi.mock('../../components/sessao/useSessao', () => ({ default: vi.fn() }))

const PRODUTO = {
  idProduto: 1,
  nome: 'Bolo Exemplo',
  categoriaId: 1,
  categoriaNome: 'Bolos',
  custoEstimado: 7.84,
  precoAtual: 15,
  precoSugerido: 16,
  margemLucro: null,
  unidadeProducao: 'UNIDADE',
  status: 'ATIVO',
  quantidadeProduzida: 0,
  descricao: 'Massa de chocolate',
}

const LINHA = {
  idProdutoInsumo: 11,
  fkProduto: 1,
  fkInsumo: 7,
  nomeInsumo: 'Chocolate',
  quantidadeUtilizada: 250,
  unidade: 'G',
}

const CATEGORIAS = [{ idCategoriaProduto: 1, nome: 'Bolos' }]

function simularPerfil(perfil) {
  useSessao.mockReturnValue({ perfil, ehDona: perfil === 'DONA' })
}

function montarApi(extras = {}) {
  return instalarApiFalsa({
    'GET /produtos': { status: 200, data: [PRODUTO] },
    'GET /categorias-produto': { status: 200, data: CATEGORIAS },
    'GET /produtos/1/insumos': { status: 200, data: [LINHA] },
    'GET /configuracao-precificacao': { status: 200, data: { margemPadrao: 100, percentualIndiretos: 10 } },
    'PUT /produtos/1': { status: 200, data: PRODUTO },
    'POST /produtos': { status: 201, data: PRODUTO },
    ...extras,
  })
}

async function abrir(perfil = 'DONA') {
  simularPerfil(perfil)
  renderComToast(<Produtos />)
  await screen.findByText('Bolo Exemplo')
}

describe('Produtos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibilidade por perfil', () => {
    it('mostra os controles de preço e ficha para a DONA', async () => {
      montarApi()
      await abrir('DONA')

      expect(screen.getByRole('button', { name: /Novo Produto/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Editar Bolo Exemplo' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
      expect(await screen.findByRole('button', { name: 'Adicionar insumo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Editar Chocolate' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remover Chocolate' })).toBeInTheDocument()
      expect(screen.getByLabelText('Precificação estimada')).toBeInTheDocument()
    })

    it('oculta preço, custo e edição para a FUNCIONARIA e mantém o catálogo', async () => {
      const api = montarApi()
      await abrir('FUNCIONARIA')

      expect(screen.queryByRole('button', { name: /Novo Produto/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Editar Bolo Exemplo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Precificação/ })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument()
      expect(screen.getByText(/15,00/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
      expect(await screen.findByText(/Chocolate — 250 g/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Adicionar insumo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Editar Chocolate' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Remover Chocolate' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Precificação estimada')).not.toBeInTheDocument()
      expect(screen.queryByText('Custo estimado')).not.toBeInTheDocument()
      expect(screen.queryByText('Lucro estimado')).not.toBeInTheDocument()
      expect(api.chamadasDe('GET /configuracao-precificacao')).toHaveLength(0)
    })
  })

  describe('estados de carga', () => {
    it('mostra carregando e depois a lista vazia', async () => {
      let liberar
      montarApi({
        'GET /produtos': () => new Promise((resolver) => { liberar = () => resolver({ status: 200, data: [] }) }),
      })
      simularPerfil('DONA')
      renderComToast(<Produtos />)

      expect(screen.getByText('Carregando produtos...')).toHaveAttribute('role', 'status')
      expect(screen.queryByText('Nenhum produto encontrado.')).not.toBeInTheDocument()
      liberar()
      expect(await screen.findByText('Nenhum produto encontrado.')).toBeInTheDocument()
      expect(screen.queryByText('Carregando produtos...')).not.toBeInTheDocument()
    })

    it('mostra a mensagem de erro quando a carga falha', async () => {
      montarApi({ 'GET /produtos': FALHA_DE_REDE })
      simularPerfil('DONA')
      renderComToast(<Produtos />)

      const alerta = await screen.findByText(/Não foi possível carregar os produtos/)
      expect(alerta).toHaveAttribute('role', 'alert')
      expect(screen.queryByText('Nenhum produto encontrado.')).not.toBeInTheDocument()
    })
  })

  describe('valores calculados', () => {
    it('recarrega custo e preço sugerido após mudar a ficha', async () => {
      let produto = PRODUTO
      let linhas = [LINHA]
      const api = montarApi({
        'GET /produtos': () => ({ status: 200, data: [produto] }),
        'GET /produtos/1/insumos': () => ({ status: 200, data: linhas }),
        'GET /insumos': { status: 200, data: [{ idInsumo: 9, nome: 'Leite condensado', unidade: 'G', status: 'ATIVO' }] },
        'POST /produtos/1/insumos': () => {
          const nova = { ...LINHA, idProdutoInsumo: 12, fkInsumo: 9, nomeInsumo: 'Leite condensado', quantidadeUtilizada: 395 }
          linhas = [...linhas, nova]
          produto = { ...PRODUTO, custoEstimado: 9.5, precoSugerido: 19 }
          return { status: 201, data: nova }
        },
      })
      await abrir('DONA')

      fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
      const painel = await screen.findByLabelText('Precificação estimada')
      expect(painel).toHaveTextContent(/R\$\s7,84/)

      fireEvent.click(await screen.findByRole('button', { name: 'Adicionar insumo' }))
      await waitFor(() => expect(screen.getByLabelText('Insumo')).toBeEnabled())
      fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: '9' } })
      fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '395' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

      await waitFor(() => expect(screen.getByLabelText('Precificação estimada')).toHaveTextContent(/R\$\s9,50/))
      expect(screen.getByLabelText('Precificação estimada')).toHaveTextContent(/R\$\s19,00/)
      expect(api.chamadasDe('GET /produtos')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Recolher Bolo Exemplo' })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(/Leite condensado — 395 g/)).toBeInTheDocument()
    })

    it('mostra custo e preço sugerido só para leitura e não os envia', async () => {
      const api = montarApi()
      await abrir('DONA')

      fireEvent.click(screen.getByRole('button', { name: 'Expandir Bolo Exemplo' }))
      const painel = await screen.findByLabelText('Precificação estimada')
      expect(painel).toHaveTextContent(/R\$\s7,84/)
      expect(painel).toHaveTextContent(/R\$\s16,00/)
      expect(within(painel).queryByRole('textbox')).not.toBeInTheDocument()
      expect(within(painel).queryByRole('spinbutton')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Editar Bolo Exemplo' }))
      expect(screen.queryByLabelText(/Custo estimado/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Preço sugerido/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))

      await waitFor(() => expect(api.chamadasDe('PUT /produtos/1')).toHaveLength(1))
      const corpo = JSON.parse(api.chamadasDe('PUT /produtos/1')[0].corpo)
      expect(corpo).not.toHaveProperty('custoEstimado')
      expect(corpo).not.toHaveProperty('precoSugerido')
      expect(corpo.precoAtual).toBe(15)
      expect(await screen.findByText('Produto salvo.')).toBeInTheDocument()
    })

    it('não envia os campos antigos ao criar um produto', async () => {
      const api = montarApi()
      await abrir('DONA')

      fireEvent.click(screen.getByRole('button', { name: /Novo Produto/ }))
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Brigadeiro' } })
      fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText('Preço atual'), { target: { value: '4.5' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))

      await waitFor(() => expect(api.chamadasDe('POST /produtos')).toHaveLength(1))
      const corpo = JSON.parse(api.chamadasDe('POST /produtos')[0].corpo)
      expect(corpo).toEqual({
        nome: 'Brigadeiro',
        fkCategoriaProduto: 1,
        precoAtual: 4.5,
        margemLucro: null,
        unidadeProducao: 'UNIDADE',
        status: 'ATIVO',
        quantidadeProduzida: 0,
        descricao: '',
      })
    })
  })

  describe('margem própria', () => {
    async function salvarComMargem(texto) {
      const api = montarApi()
      await abrir('DONA')
      fireEvent.click(screen.getByRole('button', { name: 'Editar Bolo Exemplo' }))
      fireEvent.change(screen.getByLabelText('Margem própria (%)'), { target: { value: texto } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))
      await waitFor(() => expect(api.chamadasDe('PUT /produtos/1')).toHaveLength(1))
      return JSON.parse(api.chamadasDe('PUT /produtos/1')[0].corpo)
    }

    it('envia null quando a margem própria está vazia', async () => {
      expect((await salvarComMargem('')).margemLucro).toBeNull()
    })

    it('envia o valor informado', async () => {
      expect((await salvarComMargem('120')).margemLucro).toBe(120)
    })

    it('mostra o texto de ajuda e preenche a margem do produto ao editar', async () => {
      montarApi({ 'GET /produtos': { status: 200, data: [{ ...PRODUTO, margemLucro: 62.5 }] } })
      await abrir('DONA')
      fireEvent.click(screen.getByRole('button', { name: 'Editar Bolo Exemplo' }))

      const campo = screen.getByLabelText('Margem própria (%)')
      expect(campo).toHaveValue('62,5')
      expect(campo).toHaveAccessibleDescription(/Percentual somado ao custo/)
    })

    it('recusa margem negativa sem chamar a API', async () => {
      const api = montarApi()
      await abrir('DONA')
      fireEvent.click(screen.getByRole('button', { name: 'Editar Bolo Exemplo' }))
      fireEvent.change(screen.getByLabelText('Margem própria (%)'), { target: { value: '-5' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))

      expect(await screen.findByText('Informe uma margem maior ou igual a zero.')).toBeInTheDocument()
      expect(api.chamadasDe('PUT /produtos/1')).toHaveLength(0)
    })
  })

  it('mantém o formulário aberto e avisa quando salvar falha', async () => {
    montarApi({ 'PUT /produtos/1': { status: 400, data: { message: 'Preço atual deve ser maior ou igual a zero' } } })
    await abrir('DONA')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Bolo Exemplo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))

    expect(await screen.findByText('Preço atual deve ser maior ou igual a zero')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Bolo Exemplo')
  })

  it('salva a configuração de precificação e recarrega os produtos', async () => {
    const api = montarApi({ 'PUT /configuracao-precificacao': { status: 200, data: { margemPadrao: 80, percentualIndiretos: 5 } } })
    await abrir('DONA')

    fireEvent.click(screen.getByRole('button', { name: 'Precificação' }))
    fireEvent.change(await screen.findByLabelText('Margem padrão (%)'), { target: { value: '80' } })
    fireEvent.change(screen.getByLabelText('Custos indiretos (%)'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => expect(api.chamadasDe('GET /produtos')).toHaveLength(2))
    expect(JSON.parse(api.chamadasDe('PUT /configuracao-precificacao')[0].corpo)).toEqual({
      margemPadrao: 80,
      percentualIndiretos: 5,
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('alerta de preço abaixo do sugerido', () => {
    const OUTRO = { ...PRODUTO, idProduto: 2, nome: 'Brownie Exemplo', precoAtual: 20, precoSugerido: 18 }

    it('conta os produtos abaixo do sugerido e filtra a lista', async () => {
      montarApi({
        'GET /produtos': { status: 200, data: [PRODUTO, OUTRO] },
        'GET /produtos/2/insumos': { status: 200, data: [] },
      })
      await abrir('DONA')

      expect(screen.getByText('1 produto com preço abaixo do sugerido')).toBeInTheDocument()
      expect(screen.getAllByText('Preço abaixo do sugerido')).toHaveLength(1)

      fireEvent.click(screen.getByRole('button', { name: 'Mostrar só esses' }))
      expect(screen.getByText('Bolo Exemplo')).toBeInTheDocument()
      expect(screen.queryByText('Brownie Exemplo')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Mostrar todos' }))
      expect(screen.getByText('Brownie Exemplo')).toBeInTheDocument()
    })

    it('não mostra nada quando o preço atual alcança o sugerido', async () => {
      montarApi({ 'GET /produtos': { status: 200, data: [OUTRO] }, 'GET /produtos/2/insumos': { status: 200, data: [] } })
      simularPerfil('DONA')
      renderComToast(<Produtos />)
      await screen.findByText('Brownie Exemplo')

      expect(screen.queryByText(/preço abaixo do sugerido/i)).not.toBeInTheDocument()
    })

    it('esconde o alerta da FUNCIONARIA', async () => {
      montarApi()
      await abrir('FUNCIONARIA')

      expect(screen.queryByText(/preço abaixo do sugerido/i)).not.toBeInTheDocument()
    })
  })

  describe('categorias', () => {
    it('cria categoria pelo botão e recarrega a lista', async () => {
      const api = montarApi({
        'POST /categorias-produto': { status: 201, data: { idCategoriaProduto: 5, nome: 'Doces' } },
      })
      await abrir('DONA')

      fireEvent.click(screen.getByRole('button', { name: /Categoria/ }))
      fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Doces' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar categoria' }))

      await waitFor(() => expect(api.chamadasDe('GET /categorias-produto')).toHaveLength(2))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('oferece editar só com uma categoria selecionada', async () => {
      const api = montarApi({
        'PUT /categorias-produto/1': { status: 200, data: { idCategoriaProduto: 1, nome: 'Bolos grandes' } },
      })
      await abrir('FUNCIONARIA')

      expect(screen.queryByRole('button', { name: /Editar categoria/ })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Bolos' }))
      fireEvent.click(screen.getByRole('button', { name: /Editar categoria/ }))
      fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Bolos grandes' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar categoria' }))

      await waitFor(() => expect(api.chamadasDe('PUT /categorias-produto/1')).toHaveLength(1))
    })
  })
})
