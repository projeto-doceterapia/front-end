// Fictitious sample data shaped like the API responses, with dates relative to today.

function dia(deslocamento) {
  const data = new Date()
  data.setDate(data.getDate() + deslocamento)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function mes(deslocamento) {
  const data = new Date()
  data.setDate(1)
  data.setMonth(data.getMonth() + deslocamento)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

const CATEGORIAS_PRODUTO = [
  { idCategoriaProduto: 1, nome: 'Bolos', descricao: 'Bolos inteiros e de pote' },
  { idCategoriaProduto: 2, nome: 'Doces', descricao: 'Docinhos de festa' },
]

function produto(idProduto, categoria, nome, custoEstimado, precoAtual, descricao, margemLucro = 140) {
  const precoSugerido = Math.round(custoEstimado * 1.2 * (1 + 1.4) * 100) / 100
  return {
    idProduto, categoriaId: categoria.idCategoriaProduto, categoriaNome: categoria.nome, nome, custoEstimado, precoAtual,
    precoSugerido, margemLucro, unidadeProducao: 'UNIDADE', status: 'ATIVO', quantidadeProduzida: 1, descricao,
    precoAbaixoDoSugerido: precoAtual < precoSugerido,
  }
}

const PRODUTOS = [
  produto(1, CATEGORIAS_PRODUTO[0], 'Bolo de cenoura com chocolate', 24.4, 85, 'Bolo de 20 cm com cobertura de chocolate meio amargo.'),
  produto(2, CATEGORIAS_PRODUTO[0], 'Bolo de pote de ninho', 6.1, 15, 'Pote de 250 ml com creme de leite ninho.', null),
  produto(3, CATEGORIAS_PRODUTO[1], 'Brigadeiro gourmet (cento)', 48, 150, 'Cento de brigadeiros com chocolate belga.'),
  produto(4, CATEGORIAS_PRODUTO[1], 'Beijinho (cento)', 39.5, 120, 'Cento de beijinhos com coco fresco.'),
]

const FICHAS = {
  1: [
    { idProdutoInsumo: 11, fkProduto: 1, fkInsumo: 1, nomeInsumo: 'Farinha de trigo', quantidadeUtilizada: 0.4, unidade: 'KG' },
    { idProdutoInsumo: 12, fkProduto: 1, fkInsumo: 2, nomeInsumo: 'Chocolate meio amargo', quantidadeUtilizada: 0.3, unidade: 'KG' },
    { idProdutoInsumo: 13, fkProduto: 1, fkInsumo: 4, nomeInsumo: 'Ovos', quantidadeUtilizada: 4, unidade: 'UNIDADE' },
  ],
}

const CATEGORIAS_INSUMO = [
  { idCategoriaInsumo: 1, nome: 'Base', descricao: null },
  { idCategoriaInsumo: 2, nome: 'Chocolates', descricao: null },
  { idCategoriaInsumo: 3, nome: 'Embalagens', descricao: null },
]

const INSUMOS = [
  { idInsumo: 1, categoriaId: 1, categoriaNome: 'Base', nome: 'Farinha de trigo', quantidadeAtual: 12, quantidadeMinima: 5, unidade: 'KG', status: 'ATIVO', marca: 'Marca Exemplo', custoUnitario: 6.5 },
  { idInsumo: 2, categoriaId: 2, categoriaNome: 'Chocolates', nome: 'Chocolate meio amargo', quantidadeAtual: 1.2, quantidadeMinima: 3, unidade: 'KG', status: 'ATIVO', marca: 'Cacau Fictício', custoUnitario: 58 },
  { idInsumo: 3, categoriaId: 1, categoriaNome: 'Base', nome: 'Leite condensado', quantidadeAtual: 2.5, quantidadeMinima: 3.5, unidade: 'KG', status: 'ATIVO', marca: null, custoUnitario: 22 },
  { idInsumo: 4, categoriaId: 1, categoriaNome: 'Base', nome: 'Ovos', quantidadeAtual: 60, quantidadeMinima: 24, unidade: 'UNIDADE', status: 'ATIVO', marca: null, custoUnitario: 0.9 },
  { idInsumo: 5, categoriaId: 3, categoriaNome: 'Embalagens', nome: 'Pote plástico 250 ml', quantidadeAtual: 0, quantidadeMinima: 30, unidade: 'UNIDADE', status: 'ATIVO', marca: null, custoUnitario: 0.75 },
]

function movimento(idMovimentacao, insumoId, tipo, quantidade, saldoAtual, deslocamento, hora) {
  const insumo = INSUMOS.find((linha) => linha.idInsumo === insumoId)
  return {
    idMovimentacao, insumoId, tipo, quantidade, quantidadeInformada: Math.abs(quantidade), unidadeInformada: insumo.unidade,
    custoUnitario: insumo.custoUnitario, origem: tipo === 'SAIDA_PRODUCAO' ? 'PEDIDO' : 'MANUAL', saldoAtual, duplicado: false,
    ocorridoEm: `${dia(deslocamento)}T${hora}:00`,
  }
}

const MOVIMENTOS = [
  movimento(4, 5, 'SAIDA_PRODUCAO', -12, 0, 0, '10:20'),
  movimento(2, 2, 'SAIDA_PRODUCAO', -0.6, 1.2, -1, '14:40'),
  movimento(3, 4, 'ENTRADA_COMPRA', 30, 60, -2, '08:05'),
  movimento(1, 1, 'ENTRADA_COMPRA', 10, 12, -3, '09:15'),
]

const CLIENTES = [
  { idCliente: 1, nome: 'Ana Exemplo', telefone: '+55 11 90000-0001', endereco: 'Rua das Flores, 120, Centro, São Paulo - SP', cep: '01001000', tipoPessoa: 'FISICA', classificacaoCliente: 'FREQUENTE', status: 'ATIVO', observacao: null },
  { idCliente: 2, nome: 'Bruno Fictício', telefone: '+55 11 90000-0002', endereco: 'Av. Exemplo, 45, Vila Teste, São Paulo - SP', cep: '01002000', tipoPessoa: 'FISICA', classificacaoCliente: 'PADRAO', status: 'ATIVO', observacao: null },
  { idCliente: 3, nome: 'Café Modelo Ltda.', telefone: '+55 11 90000-0003', endereco: 'Rua do Comércio, 900, Centro, São Paulo - SP', cep: '01003000', tipoPessoa: 'JURIDICA', classificacaoCliente: 'ALTO_VOLUME', status: 'ATIVO', observacao: 'Entrega pela porta lateral.' },
  { idCliente: 4, nome: 'Carla Teste', telefone: '+55 11 90000-0004', endereco: 'Rua Modelo, 8, Jardim Exemplo, São Paulo - SP', cep: '01004000', tipoPessoa: 'FISICA', classificacaoCliente: 'PADRAO', status: 'ATIVO', observacao: null },
]

const RESUMO_CLIENTES = [
  { ...CLIENTES[0], totalPedidos: 6, gastoTotal: 612, ultimoPedido: dia(-4) },
  { ...CLIENTES[1], totalPedidos: 2, gastoTotal: 170, ultimoPedido: dia(-10) },
  { ...CLIENTES[2], totalPedidos: 11, gastoTotal: 2340, ultimoPedido: dia(-1) },
  { ...CLIENTES[3], totalPedidos: 1, gastoTotal: 85, ultimoPedido: dia(-20) },
]

function pedido(idPedido, cliente, statusPedido, deslocamento, formaEntrega = 'RETIRADA', anotacao = null) {
  const entrega = formaEntrega === 'ENTREGA'
  return {
    idPedido, clienteId: cliente.idCliente, nomeCliente: cliente.nome,
    tipoPedido: statusPedido === 'ORCAMENTO' ? 'ORCAMENTO' : 'PEDIDO_CONFIRMADO', statusPedido, formaEntrega,
    enderecoEntrega: entrega ? cliente.endereco : null, cep: entrega ? cliente.cep : null,
    dataEntrega: dia(deslocamento), anotacao, dataCriacao: `${dia(deslocamento - 7)}T10:00:00`,
    dataConfirmacao: statusPedido === 'ORCAMENTO' ? null : `${dia(deslocamento - 6)}T11:00:00`, confirmadoComFaltaInsumo: false,
  }
}

const PEDIDOS = [
  pedido(101, CLIENTES[0], 'EM_PRODUCAO', 0, 'ENTREGA', 'Escrever "Parabéns, Lia" no bolo.'),
  pedido(102, CLIENTES[2], 'ESPERANDO_FAZER', 0, 'ENTREGA'),
  pedido(103, CLIENTES[1], 'AGUARDANDO_ENTREGA', 0),
  pedido(104, CLIENTES[3], 'AGUARDANDO_SINAL', 1),
  pedido(105, CLIENTES[2], 'ESPERANDO_FAZER', 2, 'ENTREGA'),
  pedido(106, CLIENTES[0], 'ORCAMENTO', 3),
  pedido(107, CLIENTES[2], 'ESPERANDO_FAZER', 2),
  pedido(108, CLIENTES[1], 'ENTREGUE', -2),
  pedido(109, CLIENTES[0], 'ENTREGUE', -5, 'ENTREGA'),
  pedido(110, CLIENTES[3], 'CANCELADO', -3),
  pedido(111, CLIENTES[2], 'ESPERANDO_FAZER', 2),
]

function item(idProdutoPedido, fkPedido, linhaProduto, quantidade) {
  return {
    idProdutoPedido, fkPedido, fkProduto: linhaProduto.idProduto, quantidade, precoOriginalProduto: linhaProduto.precoAtual,
    valorUnitario: linhaProduto.precoAtual, valorTotal: linhaProduto.precoAtual * quantidade,
    custoEstimadoItem: linhaProduto.custoEstimado * quantidade, margemLucroItem: 140, observacao: null, semFichaTecnica: false,
  }
}

const ITENS = [
  item(1, 101, PRODUTOS[0], 1), item(2, 101, PRODUTOS[2], 1),
  item(3, 102, PRODUTOS[2], 3), item(4, 103, PRODUTOS[1], 6),
  item(5, 104, PRODUTOS[0], 2), item(6, 105, PRODUTOS[3], 2),
  item(7, 106, PRODUTOS[1], 10), item(8, 107, PRODUTOS[2], 1),
  item(9, 108, PRODUTOS[0], 1), item(10, 109, PRODUTOS[3], 1),
  item(11, 110, PRODUTOS[1], 4), item(12, 111, PRODUTOS[0], 1),
]

function pagamento(pedidoId, statusPagamento) {
  const valorTotal = ITENS.filter((linha) => linha.fkPedido === pedidoId).reduce((soma, linha) => soma + linha.valorTotal, 0)
  const pago = statusPagamento === 'PAGO_INTEGRAL'
  const sinalPago = pago || statusPagamento === 'AGUARDANDO_PAGAMENTO'
  return {
    idPagamento: pedidoId, pedidoId, valorTotal, valorSinal: valorTotal / 2, valorRestante: valorTotal / 2,
    formaPagamentoSinal: 'PIX', formaPagamentoRestante: 'DINHEIRO', statusPagamento,
    dataPagamentoSinal: sinalPago ? dia(-6) : null, dataPagamentoRestante: pago ? dia(-1) : null,
  }
}

const PAGAMENTOS = [
  pagamento(101, 'AGUARDANDO_PAGAMENTO'), pagamento(102, 'AGUARDANDO_PAGAMENTO'), pagamento(103, 'PAGO_INTEGRAL'),
  pagamento(104, 'AGUARDANDO_SINAL'), pagamento(105, 'AGUARDANDO_PAGAMENTO'), pagamento(106, 'AGUARDANDO_SINAL'),
  pagamento(107, 'AGUARDANDO_PAGAMENTO'), pagamento(108, 'PAGO_INTEGRAL'), pagamento(109, 'PAGO_INTEGRAL'),
  pagamento(111, 'AGUARDANDO_PAGAMENTO'),
]

const OPERACIONAIS = {
  periodo: { de: dia(-23), ate: dia(6) },
  pedidosPorStatus: { ORCAMENTO: 1, AGUARDANDO_SINAL: 1, ESPERANDO_FAZER: 4, EM_PRODUCAO: 1, AGUARDANDO_ENTREGA: 1, ENTREGUE: 2, CANCELADO: 1 },
  pedidosHoje: 3,
  pedidosSemana: 9,
  pedidosPorDia: [
    { data: dia(-5), quantidade: 1 }, { data: dia(-2), quantidade: 1 }, { data: dia(0), quantidade: 3 },
    { data: dia(1), quantidade: 1 }, { data: dia(2), quantidade: 3 }, { data: dia(3), quantidade: 1 },
  ],
  diasLotados: [{ data: dia(0), quantidade: 3 }, { data: dia(2), quantidade: 3 }],
  produtosMaisVendidos: [
    { produtoId: 2, nome: 'Bolo de pote de ninho', quantidade: 20 },
    { produtoId: 3, nome: 'Brigadeiro gourmet (cento)', quantidade: 6 },
    { produtoId: 1, nome: 'Bolo de cenoura com chocolate', quantidade: 6 },
    { produtoId: 4, nome: 'Beijinho (cento)', quantidade: 3 },
  ],
  insumosAbaixoDoMinimo: [
    { insumoId: 2, nome: 'Chocolate meio amargo', saldo: 1.2, minimo: 3, unidade: 'KG' },
    { insumoId: 3, nome: 'Leite condensado', saldo: 2.5, minimo: 3.5, unidade: 'KG' },
    { insumoId: 5, nome: 'Pote plástico 250 ml', saldo: 0, minimo: 30, unidade: 'UNIDADE' },
  ],
}

const FINANCEIROS = {
  periodo: OPERACIONAIS.periodo,
  faturamento: { total: 1845, recebido: 1290, aReceber: 555 },
  ticketMedio: 205,
  gastosInsumos: 612.4,
  lucroEstimado: 1232.6,
  margem: 66.8,
  produtosMaisVendidosPorFaturamento: [
    { produtoId: 3, nome: 'Brigadeiro gourmet (cento)', quantidade: 6, faturamento: 900 },
    { produtoId: 1, nome: 'Bolo de cenoura com chocolate', quantidade: 6, faturamento: 510 },
    { produtoId: 4, nome: 'Beijinho (cento)', quantidade: 3, faturamento: 360 },
  ],
  cancelados: { quantidade: 1, pago: 30, devolvido: 15, retido: 15 },
  emOrcamento: { quantidade: 1, valor: 150 },
  faturamentoPorMes: [
    { mes: mes(-5), total: 980, gastos: 410, lucro: 570 }, { mes: mes(-4), total: 1210, gastos: 455, lucro: 755 },
    { mes: mes(-3), total: 1105, gastos: 430, lucro: 675 }, { mes: mes(-2), total: 1530, gastos: 560, lucro: 970 },
    { mes: mes(-1), total: 1690, gastos: 590, lucro: 1100 }, { mes: mes(0), total: 1845, gastos: 612.4, lucro: 1232.6 },
  ],
}

const USUARIOS = [
  { id: 1, nome: 'Usuária de Teste', email: 'teste@example.com', perfil: 'DONA' },
  { id: 2, nome: 'Ajudante Exemplo', email: 'ajudante@example.com', perfil: 'FUNCIONARIA' },
]

function porPedido(lista, url) {
  const ids = (url.searchParams.get('pedidoId') || '').split(',').filter(Boolean).map(Number)
  return ids.length ? lista.filter((linha) => ids.includes(linha.fkPedido ?? linha.pedidoId)) : lista
}

function pedidosFiltrados(url) {
  const de = url.searchParams.get('de')
  const ate = url.searchParams.get('ate')
  const status = (url.searchParams.get('status') || '').split(',').filter(Boolean)
  return PEDIDOS.filter((linha) => (
    (!de || linha.dataEntrega >= de) && (!ate || linha.dataEntrega <= ate) && (!status.length || status.includes(linha.statusPedido))
  ))
}

const RESPOSTAS = {
  '/pedidos': pedidosFiltrados,
  '/itens-pedido': (url) => porPedido(ITENS, url),
  '/pagamentos': (url) => porPedido(PAGAMENTOS, url),
  '/produtos': () => PRODUTOS,
  '/categorias-produto': () => CATEGORIAS_PRODUTO,
  '/insumos': () => INSUMOS,
  '/categorias-insumo': () => CATEGORIAS_INSUMO,
  '/estoque/movimentos': () => MOVIMENTOS,
  '/clientes': () => CLIENTES,
  '/clientes/resumo': () => RESUMO_CLIENTES,
  '/configuracao-farol': () => ({ idConfiguracaoFarol: 1, limiteVerde: 1, limiteAmarelo: 2, limiteVermelho: 3 }),
  '/configuracao-precificacao': () => ({ margemPadrao: 140, percentualIndiretos: 20 }),
  '/indicadores/operacionais': () => OPERACIONAIS,
  '/indicadores/financeiros': () => FINANCEIROS,
  '/usuarios': () => USUARIOS,
}

// Returns the sample answer for a GET, or undefined when the path has no sample.
export function respostaExemplo(url) {
  const ficha = url.pathname.match(/^\/produtos\/(\d+)\/insumos$/)
  if (ficha) return FICHAS[ficha[1]] || []
  return RESPOSTAS[url.pathname]?.(url)
}
