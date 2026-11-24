import { AlertTriangle } from 'lucide-react'

export default function IndicadorFaltaInsumo({ pedido }) {
  if (pedido?.confirmadoComFaltaInsumo !== true) return null
  return (
    <span className="order-highlight stock-shortage-tag">
      <AlertTriangle size={12} aria-hidden="true" />
      Confirmado com falta de insumo
    </span>
  )
}
