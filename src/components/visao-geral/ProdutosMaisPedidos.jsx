const cores = ['#dc8990', '#643d2d', '#f1ab76']

export default function ProdutosMaisPedidos({ produtos, itens, pedidos }) {
  const mesAtual = new Date()
  const pedidosDoMes = pedidos.filter((pedido) => pedido.dataEntrega?.startsWith(`${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`)).map((pedido) => pedido.idPedido)
  const produtosComQuantidade = produtos.map((produto) => ({
    ...produto,
    quantidade: itens.filter((item) => item.fkProduto === produto.idProduto && pedidosDoMes.includes(item.fkPedido)).reduce((soma, item) => soma + Number(item.quantidade || 0), 0),
  })).filter((produto) => produto.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade).slice(0, 3)
  const total = produtosComQuantidade.reduce((soma, produto) => soma + produto.quantidade, 0)
  let acumulado = 0
  const faixas = produtosComQuantidade.map((produto, indice) => { const inicio = acumulado; acumulado += produto.quantidade / (total || 1) * 100; return `${cores[indice]} ${inicio}% ${acumulado}%` })

  return (
    <section className="painel grafico-produtos">
      <div className="titulo"><div><h2>3 produtos mais pedidos</h2><p>Este mes</p></div></div>
      <div className="pizza-conteudo"><div className="pizza" style={{ background: faixas.length ? `conic-gradient(${faixas.join(', ')})` : '#f6eeeb' }}><span>{total}<small>itens</small></span></div>
        <div className="legenda">
          {produtosComQuantidade.map((produto, indice) => <p key={produto.idProduto}><span><i style={{ background: cores[indice] }} />{produto.nome}</span><strong>{((produto.quantidade / total) * 100).toFixed(0)}%</strong></p>)}
          {!produtosComQuantidade.length && <p>Nenhum item registrado neste mes.</p>}
        </div>
      </div>
    </section>
  )
}
