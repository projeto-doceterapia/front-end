import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
const CAMPOS = 'input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

export default function Modal({ titulo, children, aoFechar }) {
  const idTitulo = useId()
  const dialogo = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const primeiroCampo = dialogo.current.querySelector(CAMPOS)
    ;(primeiroCampo || dialogo.current).focus()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

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
      event.preventDefault()
      event.stopPropagation()
      aoFechar()
    } else if (event.key === 'Tab') {
      prenderFoco(event)
    }
  }

  return (
    <div className="catalog-overlay">
      <section
        ref={dialogo}
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onKeyDown={aoPressionarTecla}
      >
        <header>
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar">
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
