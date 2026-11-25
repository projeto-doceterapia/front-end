import { ChevronLeft, ChevronRight } from 'lucide-react'
import { farolConfigurado } from './farolUtils'

function dataISO(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function pedidos(quantidade) {
  return `${quantidade} ${quantidade === 1 ? 'pedido' : 'pedidos'}`
}

function legendaFarol(farol) {
  if (!farol) return 'Clique em um dia para visualizar os pedidos. Configure o farol quando estiver pronto.'
  if (!farolConfigurado(farol)) return 'Farol: configure os limites para colorir os dias.'
  return <>Farol: <span className="legend-free" /> até {pedidos(farol.limiteAmarelo - 1)} <span className="legend-warning" /> até {pedidos(farol.limiteVermelho - 1)} <span className="legend-full" /> {farol.limiteVermelho}+ pedidos</>
}

export default function Calendario({ pedidos, farol, mesExibido, dataSelecionada, aoMudarMes, aoIrParaHoje, aoSelecionarData }) {
  const ano = mesExibido.getFullYear()
  const mes = mesExibido.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const dias = [...Array(primeiroDia).fill(null), ...Array.from({ length: totalDias }, (_, indice) => indice + 1)]
  const nomeMes = mesExibido.toLocaleDateString('pt-BR', { month: 'long' })

  function pedidosDoDia(dia) {
    const data = dataISO(ano, mes, dia)
    return pedidos.filter((pedido) => pedido.dataEntrega === data)
  }

  function classeFarol(quantidade) {
    if (!farolConfigurado(farol) || !quantidade) return ' neutral'
    if (quantidade >= farol.limiteVermelho) return ' full'
    if (quantidade >= farol.limiteAmarelo) return ' warning'
    return ' free'
  }

  return (
    <div className="calendar-card">
      <header className="calendar-header">
        <div><h2>{nomeMes}</h2><small>{ano}</small></div>
        <div className="calendar-actions">
          <button type="button" aria-label="Mês anterior" onClick={() => aoMudarMes(-1)}><ChevronLeft size={16} /></button>
          <button type="button" onClick={aoIrParaHoje}>Hoje</button>
          <button type="button" aria-label="Próximo mês" onClick={() => aoMudarMes(1)}><ChevronRight size={16} /></button>
        </div>
      </header>

      <div className="weekdays">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((dia) => <span key={dia}>{dia}</span>)}
      </div>

      <div className="calendar-grid">
        {dias.map((dia, indice) => {
          if (!dia) return <div className="calendar-day empty" key={`vazio-${indice}`} />

          const pedidosDia = pedidosDoDia(dia)
          const data = dataISO(ano, mes, dia)
          const classe = `calendar-day${classeFarol(pedidosDia.length)}${dataSelecionada === data ? ' selected' : ''}`

          return (
            <button type="button" className={classe} onClick={() => aoSelecionarData(data)} key={data}>
              <span className="day-number">{dia}</span>
              {!!pedidosDia.length && <div className="day-order"><strong><em /> {pedidosDia.length} {pedidosDia.length === 1 ? 'Pedido' : 'Pedidos'}</strong><small>{pedidosDia[0].nomeCliente}</small></div>}
            </button>
          )
        })}
      </div>

      <footer className="calendar-footer">
        {legendaFarol(farol)}
      </footer>
    </div>
  )
}
