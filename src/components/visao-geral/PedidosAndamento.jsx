const status = [
  ['EM_PRODUCAO', 'Em produção', 'azul'],
  ['ESPERANDO_FAZER', 'Esperando fazer', 'roxo'],
  ['AGUARDANDO_ENTREGA', 'Aguardando entrega', 'verde'],
  ['AGUARDANDO_SINAL', 'Aguardando sinal', 'amarelo'],
]

export default function PedidosAndamento({ pedidosPorStatus }) {
  return (
    <section className="painel">
      <div className="titulo"><div><h2>Pedidos em andamento</h2><p>Visão rápida da operação</p></div></div>
      <div className="pedidos">
        {status.map(([codigo, nome, classe]) => <div className={`pedido ${classe}`} key={codigo}><p>{nome}</p><strong>{pedidosPorStatus[codigo] ?? 0}</strong><small>pedidos</small></div>)}
      </div>
      <p className="pedidos-cancelados">Cancelados no período: {pedidosPorStatus.CANCELADO ?? 0}</p>
    </section>
  )
}
