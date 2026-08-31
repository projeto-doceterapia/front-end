import CabecalhoAgenda from '../../components/agenda/CabecalhoAgenda'
import Calendario from '../../components/agenda/Calendario'
import ListaPedidos from '../../components/agenda/ListaPedidos'
import ResumoAgenda from '../../components/agenda/ResumoAgenda'

export default function Agenda({ onNewOrder, onOpenOverview }) {
  return (
    <main className="agenda-page">
      <CabecalhoAgenda aoCriarPedido={onNewOrder} aoAbrirVisaoGeral={onOpenOverview} />
      <ResumoAgenda />

      <section className="agenda-layout">
        <Calendario />
        <ListaPedidos />
      </section>
    </main>
  )
}
