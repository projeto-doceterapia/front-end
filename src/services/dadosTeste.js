import api from './api'

async function obterOuCriar(url, nome, dados) {
  const resposta = await api.get(url)
  const item = (resposta.data || []).find((registro) => registro.nome === nome)

  if (item) return item

  const novoItem = await api.post(url, dados)
  return novoItem.data
}

export async function carregarDadosTeste() {
  const categoriaProduto = await obterOuCriar('/categorias-produto', 'Bolos', {
    nome: 'Bolos',
    descricao: 'Bolos personalizados',
  })

  const categoriaInsumo = await obterOuCriar('/categorias-insumo', 'Ingredientes', {
    nome: 'Ingredientes',
    descricao: 'Ingredientes para confeitaria',
  })

  await obterOuCriar('/clientes', 'Maria Silva', {
    nome: 'Maria Silva',
    telefone: '11999999999',
    endereco: 'Rua das Flores, 100, Sao Paulo',
    tipoPessoa: 'FISICA',
    classificacaoCliente: 'PADRAO',
    status: 'ATIVO',
    observacao: 'Cliente de teste',
  })

  await obterOuCriar('/produtos', 'Bolo de Chocolate', {
    fkCategoriaProduto: categoriaProduto.idCategoriaProduto,
    nome: 'Bolo de Chocolate',
    custoEstimado: 35,
    precoAtual: 120,
    precoSugerido: 140,
    margemLucro: 85,
    unidadeProducao: 'UNIDADE',
    status: 'ATIVO',
    quantidadeProduzida: 1,
    descricao: 'Bolo com recheio de brigadeiro',
  })

  await obterOuCriar('/produtos', 'Bolo de Morango', {
    fkCategoriaProduto: categoriaProduto.idCategoriaProduto,
    nome: 'Bolo de Morango',
    custoEstimado: 38,
    precoAtual: 135,
    precoSugerido: 155,
    margemLucro: 97,
    unidadeProducao: 'UNIDADE',
    status: 'ATIVO',
    quantidadeProduzida: 1,
    descricao: 'Bolo com morangos frescos',
  })

  await obterOuCriar('/insumos', 'Farinha de Trigo', {
    fkCategoriaInsumo: categoriaInsumo.idCategoriaInsumo,
    nome: 'Farinha de Trigo',
    quantidadeAtual: 2,
    quantidadeMinima: 5,
    unidade: 'KG',
    status: 'ATIVO',
    marca: 'Dona Benta',
    custoUnitario: 6.5,
  })
}
