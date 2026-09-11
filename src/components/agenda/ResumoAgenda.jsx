import { Settings2 } from 'lucide-react'

export default function ResumoAgenda({ pedidos, aoConfigurarFarol }) {
  const quantidade = (status) => pedidos.filter((pedido) => pedido.statusPedido === status).length

  return (
    <div className="agenda-stats">
      <strong>{pedidos.length} <span>Pedidos cadastrados</span></strong>
      <i />
      <strong className="orange">{quantidade('AGUARDANDO_SINAL')} <span>Aguardando sinal</span></strong>
      <i />
      <strong className="blue">{quantidade('EM_PRODUCAO')} <span>Em producao</span></strong>
      <i />
      <strong className="purple">{quantidade('AGUARDANDO_ENTREGA')} <span>Aguardando entrega</span></strong>

      <button className="outline-button" onClick={aoConfigurarFarol}>
        <Settings2 size={13} />
        Configurar farol
      </button>
    </div>
  )
}
