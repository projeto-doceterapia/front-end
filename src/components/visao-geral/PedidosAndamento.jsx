import { STATUS_PEDIDO } from '../pedidos/pedidoUtils'

const status = [
  ['EM_PRODUCAO', 'azul'],
  ['ESPERANDO_FAZER', 'roxo'],
  ['AGUARDANDO_ENTREGA', 'verde'],
  ['AGUARDANDO_SINAL', 'amarelo'],
]

export default function PedidosAndamento({ pedidosPorStatus }) {
  return (
    <section className="painel">
      <div className="titulo"><div><h2>Pedidos em andamento</h2><p>Visão rápida da operação</p></div></div>
      <div className="pedidos">
        {status.map(([codigo, classe]) => {
          const total = pedidosPorStatus[codigo] ?? 0
          return <div className={`pedido ${classe}`} key={codigo}><p>{STATUS_PEDIDO[codigo]}</p><strong>{total}</strong><small>{total === 1 ? 'pedido' : 'pedidos'}</small></div>
        })}
      </div>
      <p className="pedidos-cancelados">Cancelados no período: {pedidosPorStatus.CANCELADO ?? 0}</p>
    </section>
  )
}
