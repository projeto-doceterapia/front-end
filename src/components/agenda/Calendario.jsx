import { ChevronLeft, ChevronRight } from 'lucide-react'
import { plural } from '../formatos'
import { NIVEIS_FAROL, faixasFarol, farolConfigurado, nivelFarol } from './farolUtils'

function dataISO(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function legendaFarol(farol) {
  if (!farol) return 'Clique em um dia para ver os pedidos. Defina os limites de lotação para destacar os dias cheios.'
  if (!farolConfigurado(farol)) return 'Lotação: defina os limites para destacar os dias cheios.'
  return (
    <>
      Lotação:
      {faixasFarol(farol).map(({ nivel, texto }) => (
        <span className={`legenda-farol ${NIVEIS_FAROL[nivel].classe}`} key={nivel}><i aria-hidden="true" /> {NIVEIS_FAROL[nivel].rotulo}: {texto}</span>
      ))}
    </>
  )
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

  const hoje = new Date()
  const hojeISO = dataISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

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
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => <span key={dia}>{dia}</span>)}
      </div>

      <div className="calendar-grid">
        {dias.map((dia, indice) => {
          if (!dia) return <div className="calendar-day empty" key={`vazio-${indice}`} />

          const pedidosDia = pedidosDoDia(dia)
          const data = dataISO(ano, mes, dia)
          const nivel = nivelFarol(pedidosDia.length, farol)
          const selecionado = dataSelecionada === data
          const classe = `calendar-day ${nivel ? NIVEIS_FAROL[nivel].classe : 'neutral'}${selecionado ? ' selected' : ''}${data === hojeISO ? ' today' : ''}`

          return (
            <button type="button" className={classe} onClick={() => aoSelecionarData(data)} aria-pressed={selecionado} aria-current={data === hojeISO ? 'date' : undefined} key={data}>
              <span className="day-number">{dia}</span>
              {!!pedidosDia.length && (
                <span className="day-order">
                  <strong>{nivel && <>{NIVEIS_FAROL[nivel].rotulo} · </>}{plural(pedidosDia.length, 'pedido', 'pedidos')}</strong>
                  <small>{pedidosDia[0].nomeCliente}</small>
                </span>
              )}
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
