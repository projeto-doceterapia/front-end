const status = [
  ['EM_PRODUCAO', 'Em producao', 'azul'],
  ['ESPERANDO_FAZER', 'Esperando fazer', 'roxo'],
  ['AGUARDANDO_ENTREGA', 'Aguardando entrega', 'verde'],
  ['AGUARDANDO_SINAL', 'Aguardando sinal', 'amarelo'],
]

export default function PedidosAndamento({ pedidos }) {
  return (
    <section className="painel">
      <div className="titulo"><div><h2>Pedidos em andamento</h2><p>Visao rapida da operacao</p></div></div>
      <div className="pedidos">
        {status.map(([codigo, nome, classe]) => <div className={`pedido ${classe}`} key={codigo}><p>{nome}</p><strong>{pedidos.filter((pedido) => pedido.statusPedido === codigo).length}</strong><small>pedidos</small></div>)}
      </div>
    </section>
  )
}
