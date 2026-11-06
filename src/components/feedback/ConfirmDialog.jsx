import { useEffect, useId, useRef } from 'react'
import '../../styles/feedback.css'

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigoso = false,
  ocupado = false,
  onConfirm,
  onCancel,
}) {
  const idBase = useId()
  const dialogo = useRef(null)
  const botaoCancelar = useRef(null)
  const botaoConfirmar = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    // A disabled button drops the focus out of the dialog, so the container holds it while the call runs.
    const alvo = ocupado ? dialogo : (perigoso ? botaoCancelar : botaoConfirmar)
    alvo.current.focus()
  }, [aberto, ocupado, perigoso])

  if (!aberto) return null

  function cancelar() {
    if (!ocupado) onCancel()
  }

  function prenderFoco(event) {
    const focaveis = [...dialogo.current.querySelectorAll(FOCAVEIS)]
    if (focaveis.length === 0) {
      event.preventDefault()
      return
    }
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    const atual = document.activeElement
    if (event.shiftKey && (atual === primeiro || atual === dialogo.current)) {
      event.preventDefault()
      ultimo.focus()
    } else if (!event.shiftKey && atual === ultimo) {
      event.preventDefault()
      primeiro.focus()
    }
  }

  function aoPressionarTecla(event) {
    if (event.key === 'Escape') {
      // Without both calls a native <dialog> underneath would close together with this one.
      event.preventDefault()
      event.stopPropagation()
      cancelar()
    } else if (event.key === 'Tab') {
      prenderFoco(event)
    }
  }

  return (
    <div
      className="confirm-overlay"
      // Keeps the focus inside the dialog; otherwise Esc would reach whatever is underneath.
      onMouseDown={(event) => { if (event.target === event.currentTarget) event.preventDefault() }}
      onClick={(event) => { if (event.target === event.currentTarget) cancelar() }}
    >
      <div
        ref={dialogo}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
        aria-describedby={`${idBase}-mensagem`}
        aria-busy={ocupado}
        tabIndex={-1}
        onKeyDown={aoPressionarTecla}
      >
        <h2 id={`${idBase}-titulo`}>{titulo}</h2>
        <div id={`${idBase}-mensagem`} className="confirm-mensagem">{mensagem}</div>
        <div className="confirm-acoes">
          <button ref={botaoCancelar} type="button" className="confirm-botao confirm-cancelar" disabled={ocupado} onClick={onCancel}>
            {textoCancelar}
          </button>
          <button
            ref={botaoConfirmar}
            type="button"
            className={`confirm-botao ${perigoso ? 'confirm-perigo' : 'confirm-padrao'}`}
            disabled={ocupado}
            onClick={onConfirm}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
