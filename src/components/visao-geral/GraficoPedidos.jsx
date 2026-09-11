import { useState } from 'react'

export default function GraficoPedidos({ pedidos }) {
  const [periodo, setPeriodo] = useState('7')
  const dias = criarDias(periodo)
  const dados = dias.map((data) => ({ data, total: pedidos.filter((pedido) => pedido.dataEntrega === dataISO(data)).length }))
  const maior = Math.max(...dados.map((dia) => dia.total), 1)

  return (
    <section className="painel grafico-pedidos">
      <div className="titulo"><div><h2>Pedidos por dia</h2><p>{periodo === 'mes' ? 'Este mes' : `Ultimos ${periodo} dias`}</p></div><div className="filtros">{[['7', '7 dias'], ['14', '14 dias'], ['mes', 'Este mes']].map(([valor, texto]) => <button type="button" className={periodo === valor ? 'active' : ''} onClick={() => setPeriodo(valor)} key={valor}>{texto}</button>)}</div></div>
      <div className="barras">
        {dados.map((dia) => <div className="coluna" key={dataISO(dia.data)}><span className="valor-barra">{dia.total}</span><i style={{ height: `${Math.max(6, (dia.total / maior) * 180)}px` }} /><small>{dia.data.toLocaleDateString('pt-BR', { weekday: 'short' })}<br />{dia.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</small></div>)}
      </div>
    </section>
  )
}

function criarDias(periodo) {
  const hoje = new Date()
  if (periodo === 'mes') {
    const total = hoje.getDate()
    return Array.from({ length: total }, (_, indice) => new Date(hoje.getFullYear(), hoje.getMonth(), indice + 1))
  }
  return Array.from({ length: Number(periodo) }, (_, indice) => { const data = new Date(hoje); data.setDate(hoje.getDate() - Number(periodo) + 1 + indice); return data })
}

function dataISO(data) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}` }
