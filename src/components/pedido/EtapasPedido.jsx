import { Check } from 'lucide-react'

const etapas = ['Cliente e entrega', 'Itens do pedido', 'Pagamento e resumo']

export default function EtapasPedido({ etapa }) {
  return (
    <>
      <ol className="steps" aria-label="Etapas do pedido">
        {etapas.map((texto, indice) => (
          <Etapa texto={texto} numero={indice + 1} etapaAtual={etapa} key={texto} />
        ))}
      </ol>
      <p className="steps-compact">Etapa {etapa} de {etapas.length} · {etapas[etapa - 1]}</p>
    </>
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
    <li className={classe} aria-current={etapaAtual === numero ? 'step' : undefined}>
      <b>{etapaAtual > numero ? <Check size={15} aria-hidden="true" /> : numero}</b>
      <span>Etapa {numero}: {texto}</span>
      {numero < etapas.length && <i />}
    </li>
  )
}
