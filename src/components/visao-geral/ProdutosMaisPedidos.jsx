const cores = ['#dc8990', '#643d2d', '#f1ab76', '#8aa6a3', '#c9b8d6']

export default function ProdutosMaisPedidos({ produtos }) {
  const total = produtos.reduce((soma, produto) => soma + Number(produto.quantidade), 0)
  const faixas = produtos.reduce((lista, produto, indice) => {
    const inicio = lista.length ? lista[lista.length - 1].fim : 0
    const fim = inicio + (Number(produto.quantidade) / (total || 1)) * 100
    return [...lista, { cor: cores[indice], inicio, fim }]
  }, [])
  const gradiente = faixas.map(({ cor, inicio, fim }) => `${cor} ${inicio}% ${fim}%`).join(', ')

  return (
    <section className="painel grafico-produtos">
      <div className="titulo"><div><h2>5 produtos mais vendidos</h2><p>No período selecionado</p></div></div>
      <div className="pizza-conteudo"><div className="pizza" style={{ background: gradiente ? `conic-gradient(${gradiente})` : '#f6eeeb' }}><span>{total}<small>itens</small></span></div>
        <div className="legenda">
          {produtos.map((produto, indice) => <p key={produto.produtoId}><span><i style={{ background: cores[indice] }} />{produto.nome}</span><strong>{((Number(produto.quantidade) / total) * 100).toFixed(0)}%</strong></p>)}
          {!produtos.length && <p>Nenhum item vendido neste período.</p>}
        </div>
      </div>
    </section>
  )
}
