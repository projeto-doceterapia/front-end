import { Settings2 } from 'lucide-react'

export default function ResumoAgenda() {
  return (
    <div className="agenda-stats">
      <strong>21 <span>Pedidos no mês</span></strong>
      <i />
      <strong className="orange">7 <span>Aguardando sinal</span></strong>
      <i />
      <strong className="blue">9 <span>Em produção</span></strong>
      <i />
      <strong className="purple">1 <span>Aguardando entrega</span></strong>

      <button className="outline-button">
        <Settings2 size={13} />
        Configurar farol
      </button>
    </div>
  )
}
