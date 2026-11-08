import { diasEntre, paraData } from './periodoUtils'

const LIMITE_DIAS_COMPLETOS = 31

export default function GraficoPedidos({ pedidosPorDia, de, ate }) {
  const dados = montarDias(pedidosPorDia, de, ate)
  const maior = Math.max(...dados.map((dia) => dia.total), 1)

  return (
    <section className="painel grafico-pedidos">
      <div className="titulo"><div><h2>Pedidos por dia</h2><p>Pela data de entrega, sem cancelados</p></div></div>
      <div className="barras">
        {dados.map((dia) => <div className="coluna" key={dia.iso}><span className="valor-barra">{dia.total}</span><i style={{ height: `${Math.max(6, (dia.total / maior) * 180)}px` }} /><small>{paraData(dia.iso).toLocaleDateString('pt-BR', { weekday: 'short' })}<br />{paraData(dia.iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small></div>)}
        {!dados.length && <p className="empty-dashboard">Nenhum pedido com entrega neste período.</p>}
      </div>
    </section>
  )
}

// Long periods would draw hundreds of bars, so only days with orders are shown there.
function montarDias(pedidosPorDia, de, ate) {
  const totais = new Map(pedidosPorDia.map((dia) => [dia.data, dia.quantidade]))
  if (diasEntre(de, ate) >= LIMITE_DIAS_COMPLETOS) {
    return pedidosPorDia.map((dia) => ({ iso: dia.data, total: dia.quantidade }))
  }
  const inicio = paraData(de)
  return Array.from({ length: diasEntre(de, ate) + 1 }, (_, indice) => {
    const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice)
    const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
    return { iso, total: totais.get(iso) ?? 0 }
  })
}
