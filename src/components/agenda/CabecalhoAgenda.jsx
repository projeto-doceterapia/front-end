import { Database, Plus } from 'lucide-react'

export default function CabecalhoAgenda({ aoCriarPedido, aoCarregarDadosTeste, carregandoDados }) {
  return (
    <div className="agenda-heading">
      <div>
        <h1>Agenda</h1>
        <p>Visualize e organize os pedidos por data</p>
      </div>

      <div className="agenda-actions">
        <button className="outline-button" onClick={aoCarregarDadosTeste} disabled={carregandoDados}>
          <Database size={16} />
          {carregandoDados ? 'Carregando...' : 'Dados de teste'}
        </button>
        <button className="primary-button" onClick={aoCriarPedido}>
          <Plus size={16} />
          Novo Pedido
        </button>
      </div>
    </div>
  )
}
