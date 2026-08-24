function GraficoPedidos() {
  const barras = [4, 7, 5, 9, 12, 15, 6]
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <section className="painel">
      <div className="titulo"><div><h2>Pedidos por dia</h2><p>Últimos 7 dias</p></div><div className="filtros"><b>7 dias</b><span>14 dias</span><span>Este mês</span></div></div>
      <div className="barras">
        {barras.map((altura, indice) => (
          <div className="coluna" key={dias[indice]}><i style={{ height: `${altura * 9}px` }}></i><small>{dias[indice]}<br />{20 + indice}/05</small></div>
        ))}
      </div>
    </section>
  )
}

export default GraficoPedidos
