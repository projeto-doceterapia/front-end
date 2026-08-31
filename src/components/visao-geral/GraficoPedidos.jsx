const pedidos = [
  ['Seg', '20/05', 4],
  ['Ter', '21/05', 7],
  ['Qua', '22/05', 5],
  ['Qui', '23/05', 9],
  ['Sex', '24/05', 12],
  ['Sáb', '25/05', 15],
  ['Dom', '26/05', 6],
]

export default function GraficoPedidos() {
  return (
    <section className="painel grafico-pedidos">
      <div className="titulo">
        <div>
          <h2>Pedidos por dia</h2>
          <p>Últimos 7 dias</p>
        </div>

        <div className="filtros">
          <b>7 dias</b>
          <span>14 dias</span>
          <span>Este mês</span>
        </div>
      </div>

      <div className="barras">
        {pedidos.map((pedido) => (
          <div className="coluna" key={pedido[0]}>
            <span className="valor-barra">{pedido[2]}</span>
            <i style={{ height: `${pedido[2] * 10}px` }}></i>
            <small>{pedido[0]}<br />{pedido[1]}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
