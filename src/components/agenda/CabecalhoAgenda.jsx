import { Plus } from 'lucide-react'

export default function CabecalhoAgenda({ aoCriarPedido, aoAbrirVisaoGeral }) {
  return (
    <div className="agenda-heading">
      <div>
        <h1>Agenda</h1>
        <p>Visualize e organize os pedidos por data</p>
      </div>

      <div className="agenda-actions">
        <button className="outline-button" onClick={aoAbrirVisaoGeral}>Visão geral</button>
        <button className="primary-button" onClick={aoCriarPedido}>
          <Plus size={16} />
          Novo Pedido
        </button>
      </div>
    </div>
  )
}
