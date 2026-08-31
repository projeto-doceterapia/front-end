const produtos = [
  ['p1', 'Bolo Personalizado', '34%'],
  ['p2', 'Bolo de Pote', '21%'],
  ['p3', 'Brigadeiro Gourmet', '18%'],
  ['p4', 'Demais Opções', '27%'],
]

export default function ProdutosMaisPedidos() {
  return (
    <section className="painel grafico-produtos">
      <div className="titulo">
        <div>
          <h2>3 produtos mais pedidos</h2>
          <p>Este mês</p>
        </div>
      </div>

      <div className="pizza-conteudo">
        <div className="pizza"></div>

        <div className="legenda">
          {produtos.map((produto) => (
            <p key={produto[1]}>
              <span><i className={produto[0]}></i>{produto[1]}</span>
              <strong>{produto[2]}</strong>
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
