import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export default function ModalEstoque({ titulo, subtitulo, aoFechar, ocupado, children }) {
  const idTitulo = useId()
  const dialogo = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  return (
    <dialog ref={dialogo} className="stock-modal" aria-modal="true" aria-labelledby={idTitulo}
      onCancel={(event) => { event.preventDefault(); if (!ocupado) aoFechar() }}
      onClick={(event) => { if (event.target === event.currentTarget && !ocupado) aoFechar() }}>
      <header className="stock-modal-heading">
        <div><h2 id={idTitulo}>{titulo}</h2>{subtitulo && <p>{subtitulo}</p>}</div>
        <button type="button" className="stock-icon-button" aria-label="Fechar" disabled={ocupado} onClick={aoFechar}><X size={14} /></button>
      </header>
      {children}
    </dialog>
  )
}
