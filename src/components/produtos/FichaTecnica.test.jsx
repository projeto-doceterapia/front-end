import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import FichaTecnica from './FichaTecnica'
import useFichaTecnica from './useFichaTecnica'
import renderComToast from '../../test/renderComToast'
import instalarApiFalsa, { FALHA_DE_REDE } from '../../test/apiFalsa'

const PRODUTO = { idProduto: 4, nome: 'Bolo de pote' }

const INSUMOS = [
  { idInsumo: 7, nome: 'Chocolate meio amargo', unidade: 'KG', status: 'ATIVO' },
  { idInsumo: 9, nome: 'Leite condensado', unidade: 'KG', status: 'ATIVO' },
  { idInsumo: 15, nome: 'Pote plástico', unidade: 'UNIDADE', status: 'ATIVO' },
  { idInsumo: 20, nome: 'Corante antigo', unidade: 'G', status: 'INATIVO' },
]

const LINHA_CHOCOLATE = {
  idProdutoInsumo: 11,
  fkProduto: 4,
  fkInsumo: 7,
  nomeInsumo: 'Chocolate meio amargo',
  quantidadeUtilizada: 250,
  unidade: 'G',
}

function Ficha({ podeEditar = true, onFichaAlterada }) {
  const ficha = useFichaTecnica(PRODUTO.idProduto)
  return (
    <FichaTecnica
      produto={PRODUTO}
      ficha={ficha}
      podeEditar={podeEditar}
      onFichaAlterada={onFichaAlterada}
    />
  )
}

function montarApi(extras = {}) {
  const estado = { linhas: [LINHA_CHOCOLATE] }
  const api = instalarApiFalsa({
    'GET /produtos/4/insumos': () => ({ status: 200, data: [...estado.linhas] }),
    'GET /insumos': { status: 200, data: INSUMOS },
    'POST /produtos/4/insumos': () => {
      const linha = {
        idProdutoInsumo: 12,
        fkProduto: 4,
        fkInsumo: 9,
        nomeInsumo: 'Leite condensado',
        quantidadeUtilizada: 395,
        unidade: 'G',
      }
      estado.linhas.push(linha)
      return { status: 201, data: linha }
    },
    'PUT /produtos/4/insumos/11': () => {
      estado.linhas[0] = { ...LINHA_CHOCOLATE, quantidadeUtilizada: 300 }
      return { status: 200, data: estado.linhas[0] }
    },
    'DELETE /produtos/4/insumos/11': () => {
      estado.linhas = []
      return { status: 204, data: null }
    },
    ...extras,
  })
  return { api, estado }
}

function corpoDe(api, rota) {
  return JSON.parse(api.chamadasDe(rota)[0].corpo)
}

async function abrirFormularioNovo() {
  await screen.findByText(/Chocolate meio amargo — 250 g/)
  fireEvent.click(screen.getByRole('button', { name: /Adicionar insumo/ }))
  await screen.findByLabelText('Insumo')
  await waitFor(() => expect(screen.getByLabelText('Insumo')).toBeEnabled())
}

function preencher({ insumo, quantidade, unidade }) {
  fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: insumo } })
  fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: quantidade } })
  if (unidade) fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: unidade } })
}

describe('FichaTecnica', () => {
  it('adiciona insumo à ficha', async () => {
    const { api } = montarApi()
    const onFichaAlterada = vi.fn()
    renderComToast(<Ficha onFichaAlterada={onFichaAlterada} />)

    await abrirFormularioNovo()
    preencher({ insumo: '9', quantidade: '395', unidade: 'G' })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    expect(await screen.findByText(/Leite condensado — 395 g/)).toBeInTheDocument()
    expect(corpoDe(api, 'POST /produtos/4/insumos')).toEqual({
      fkInsumo: 9,
      quantidadeUtilizada: 395,
      unidade: 'G',
    })
    expect(screen.getByText('Insumo adicionado à ficha técnica.')).toBeInTheDocument()
    expect(onFichaAlterada).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('Insumo')).not.toBeInTheDocument()
  })

  it('aceita vírgula na quantidade e oferece só as unidades compatíveis', async () => {
    const { api } = montarApi()
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: '15' } })
    expect(within(screen.getByLabelText('Unidade')).getAllByRole('option').map((o) => o.value)).toEqual(['UNIDADE'])

    fireEvent.change(screen.getByLabelText('Insumo'), { target: { value: '9' } })
    expect(within(screen.getByLabelText('Unidade')).getAllByRole('option').map((o) => o.value)).toEqual(['KG', 'G'])
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '0,25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    await waitFor(() => expect(api.chamadasDe('POST /produtos/4/insumos')).toHaveLength(1))
    expect(corpoDe(api, 'POST /produtos/4/insumos')).toEqual({
      fkInsumo: 9,
      quantidadeUtilizada: 0.25,
      unidade: 'KG',
    })
  })

  it('recusa quantidade zero sem chamar a API', async () => {
    const { api } = montarApi()
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    preencher({ insumo: '9', quantidade: '0' })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    expect(await screen.findByText('Informe uma quantidade maior que zero.')).toBeInTheDocument()
    expect(api.chamadasDe('POST /produtos/4/insumos')).toHaveLength(0)
  })

  it('edita linha da ficha', async () => {
    const { api } = montarApi()
    renderComToast(<Ficha />)

    await screen.findByText(/Chocolate meio amargo — 250 g/)
    fireEvent.click(screen.getByRole('button', { name: 'Editar Chocolate meio amargo' }))
    await waitFor(() => expect(screen.getByLabelText('Insumo')).toBeEnabled())
    expect(screen.getByLabelText('Quantidade')).toHaveValue('250')

    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    expect(await screen.findByText(/Chocolate meio amargo — 300 g/)).toBeInTheDocument()
    expect(corpoDe(api, 'PUT /produtos/4/insumos/11')).toEqual({
      fkInsumo: 7,
      quantidadeUtilizada: 300,
      unidade: 'G',
    })
    expect(screen.getByText('Ficha técnica atualizada.')).toBeInTheDocument()
  })

  it('remove linha com confirmação', async () => {
    const { api } = montarApi()
    renderComToast(<Ficha />)

    await screen.findByText(/Chocolate meio amargo — 250 g/)
    fireEvent.click(screen.getByRole('button', { name: 'Remover Chocolate meio amargo' }))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText('Remover insumo')).toBeInTheDocument()
    expect(within(dialogo).getByText('Remover Chocolate meio amargo da ficha técnica de Bolo de pote?')).toBeInTheDocument()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(api.chamadasDe('DELETE /produtos/4/insumos/11')).toHaveLength(0)
    expect(screen.getByText(/Chocolate meio amargo — 250 g/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remover Chocolate meio amargo' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Nenhum insumo na ficha técnica.')).toBeInTheDocument()
    expect(api.chamadasDe('DELETE /produtos/4/insumos/11')).toHaveLength(1)
    expect(screen.getByText('Insumo removido da ficha técnica.')).toBeInTheDocument()
  })

  it('esconde insumos já usados e inativos', async () => {
    montarApi()
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    const nomes = within(screen.getByLabelText('Insumo')).getAllByRole('option').map((o) => o.textContent)

    expect(nomes).toEqual(['Selecione', 'Leite condensado (kg)', 'Pote plástico (un.)'])
  })

  it('mostra a recusa de unidade incompatível', async () => {
    const mensagem = 'Unidade G é incompatível com a unidade UNIDADE do insumo'
    montarApi({ 'POST /produtos/4/insumos': { status: 422, data: { message: mensagem } } })
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    preencher({ insumo: '15', quantidade: '30' })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    const sobCampo = await screen.findAllByText(mensagem)
    expect(sobCampo).toHaveLength(2)
    const unidade = screen.getByLabelText('Unidade')
    expect(unidade).toHaveAccessibleDescription(mensagem)
    expect(screen.getByLabelText('Quantidade')).toHaveValue('30')
    expect(screen.getByLabelText('Insumo')).toHaveValue('15')
    expect(screen.queryByText(/Pote plástico — /)).not.toBeInTheDocument()
  })

  it('usa o texto padrão quando o 422 vem sem mensagem', async () => {
    montarApi({ 'POST /produtos/4/insumos': { status: 422, data: {} } })
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    preencher({ insumo: '15', quantidade: '30' })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    const textos = await screen.findAllByText('A unidade escolhida não combina com a unidade do insumo.')
    expect(textos).toHaveLength(2)
  })

  it('avisa a duplicidade e mantém o formulário', async () => {
    montarApi({ 'POST /produtos/4/insumos': { status: 409, data: null } })
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    preencher({ insumo: '9', quantidade: '10' })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar insumo' }))

    expect(await screen.findByText('Este insumo já está na ficha técnica.')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toHaveValue('10')
  })

  it('mostra os estados da ficha', async () => {
    let liberar
    montarApi({
      'GET /produtos/4/insumos': () => new Promise((resolver) => { liberar = () => resolver({ status: 200, data: [] }) }),
    })
    renderComToast(<Ficha />)

    expect(screen.getByText('Carregando insumos...')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum insumo na ficha técnica.')).not.toBeInTheDocument()
    liberar()
    expect(await screen.findByText('Nenhum insumo na ficha técnica.')).toBeInTheDocument()
  })

  it('mostra erro quando a ficha não carrega', async () => {
    montarApi({ 'GET /produtos/4/insumos': FALHA_DE_REDE })
    renderComToast(<Ficha />)

    expect(await screen.findByText('Não foi possível carregar os insumos.')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum insumo na ficha técnica.')).not.toBeInTheDocument()
  })

  it('não envia duas vezes', async () => {
    let liberar
    const { api } = montarApi({
      'POST /produtos/4/insumos': () => new Promise((resolver) => {
        liberar = () => resolver({ status: 201, data: {} })
      }),
    })
    renderComToast(<Ficha />)

    await abrirFormularioNovo()
    preencher({ insumo: '9', quantidade: '10' })
    const salvar = screen.getByRole('button', { name: 'Salvar insumo' })
    fireEvent.click(salvar)
    fireEvent.click(salvar)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled())
    expect(api.chamadasDe('POST /produtos/4/insumos')).toHaveLength(1)
    liberar()
    await waitFor(() => expect(screen.queryByLabelText('Insumo')).not.toBeInTheDocument())
  })

  it('só lista as linhas quando não pode editar', async () => {
    montarApi()
    renderComToast(<Ficha podeEditar={false} />)

    expect(await screen.findByText(/Chocolate meio amargo — 250 g/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar insumo/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover/ })).not.toBeInTheDocument()
    expect(screen.getByText('Quantidades para 1 unidade vendida.')).toBeInTheDocument()
  })
})
