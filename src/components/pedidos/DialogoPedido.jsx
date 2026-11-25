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
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cabecalho.current.focus()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  // A button that disables or disappears after an action drops the focus to the body without a blur event.
  useEffect(() => {
    const observador = new MutationObserver(() => {
      const ativo = document.activeElement
      if (!ativo || ativo === document.body) cabecalho.current?.focus()
    })
    observador.observe(dialogo.current, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] })
    return () => observador.disconnect()
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
