import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import '../../styles/produtos.css'

export default function DialogoCatalogo({ titulo, subtitulo, aoFechar, ocupado = false, children }) {
  const idTitulo = useId()
  const dialogo = useRef(null)

  useEffect(() => {
    const origem = document.activeElement
    if (!dialogo.current.contains(document.activeElement)) dialogo.current.focus()
    return () => {
      if (origem?.isConnected) origem.focus()
    }
  }, [])

  function aoPressionarTecla(event) {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    if (!ocupado) aoFechar()
  }

  return (
    <div className="farol-overlay">
      <div
        ref={dialogo}
        className="farol-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onKeyDown={aoPressionarTecla}
      >
        <header>
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" onClick={aoFechar} disabled={ocupado} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
