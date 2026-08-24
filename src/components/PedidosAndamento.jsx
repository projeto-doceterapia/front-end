function PedidosAndamento() {
  const pedidos = [
    ['◷', 'Em produção', '5', 'azul'],
    ['◉', 'Esperando fazer', '4', 'roxo'],
    ['♧', 'Aguardando entrega', '3', 'verde'],
    ['$', 'Aguardando sinal', '4', 'amarelo'],
  ]

  return (
    <section className="painel">
      <div className="titulo"><div><h2>Pedidos em andamento</h2><p>Visão rápida da operação</p></div><a>Ver todos →</a></div>
      <div className="pedidos">
        {pedidos.map((pedido) => (
          <div className={`pedido ${pedido[3]}`} key={pedido[1]}>
            <p>{pedido[0]} &nbsp;{pedido[1]}</p><strong>{pedido[2]}</strong><small>pedidos</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PedidosAndamento
