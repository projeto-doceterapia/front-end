import { Check } from 'lucide-react'

const etapas = ['Cliente e entrega', 'Itens do pedido', 'Pagamento e resumo']

export default function EtapasPedido({ etapa }) {
  return (
    <div className="steps">
      {etapas.map((texto, indice) => (
        <Etapa texto={texto} numero={indice + 1} etapaAtual={etapa} key={texto} />
      ))}
    </div>
  )
}

function Etapa({ texto, numero, etapaAtual }) {
  let classe = 'step'

  if (etapaAtual === numero) {
    classe += ' active'
  }

  if (etapaAtual > numero) {
    classe += ' done'
  }

  return (
    <div className={classe}>
      <b>{etapaAtual > numero ? <Check size={15} /> : numero}</b>
      <span>Etapa {numero}: {texto}</span>
      {numero < 3 && <i />}
    </div>
  )
}
