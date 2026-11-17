import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function DialogoPedido({ titulo, subtitulo, ocupado = false, onFechar, children, rodape }) {
  const idTitulo = useId()
  const dialogo = useRef(null)
  const cabecalho = useRef(null)
  const aoFechar = useRef(onFechar)

  useEffect(() => {
    aoFechar.current = onFechar
  }, [onFechar])

  useEffect(() => {
    const anterior = document.activeElement
    cabecalho.current.focus()
    return () => {
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  function fechar() {
    if (!ocupado) aoFechar.current()
  }

  function prenderFoco(event) {
    const focaveis = [...dialogo.current.querySelectorAll(FOCAVEIS)]
    if (focaveis.length === 0) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    const atual = document.activeElement
    if (event.shiftKey && (atual === primeiro || atual === cabecalho.current)) {
      event.preventDefault()
      ultimo.focus()
    } else if (!event.shiftKey && atual === ultimo) {
      event.preventDefault()
      primeiro.focus()
    }
  }

  function aoPressionarTecla(event) {
    if (event.key === 'Escape') {
      // Stacked order dialogs: only the top one closes.
      event.preventDefault()
      event.stopPropagation()
      fechar()
    } else if (event.key === 'Tab') {
      prenderFoco(event)
    }
  }

  return (
    <div className="pedido-overlay" onClick={(event) => { if (event.target === event.currentTarget) fechar() }}>
      <div
        ref={dialogo}
        className="pedido-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-busy={ocupado}
        onKeyDown={aoPressionarTecla}
      >
        <header className="pedido-dialogo-topo">
          <div>
            <h2 id={idTitulo} ref={cabecalho} tabIndex={-1}>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="pedido-dialogo-fechar" aria-label="Fechar" disabled={ocupado} onClick={fechar}>
            <X size={18} />
          </button>
        </header>
        <div className="pedido-dialogo-corpo">{children}</div>
        {rodape && <footer className="pedido-dialogo-rodape">{rodape}</footer>}
      </div>
    </div>
  )
}
