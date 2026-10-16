import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ModalEstoque({ titulo, aoFechar, ocupado, children }) {
  const dialogo = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    return () => {
      document.body.style.overflow = overflow
      anterior?.focus()
    }
  }, [])

  return (
    <dialog ref={dialogo} className="stock-modal" aria-labelledby="stock-modal-title"
      onCancel={(event) => { event.preventDefault(); if (!ocupado) aoFechar() }}
      onClick={(event) => { if (event.target === event.currentTarget && !ocupado) aoFechar() }}>
      <header className="stock-modal-heading">
        <div><h2 id="stock-modal-title">{titulo}</h2><p>Preencha os dados do insumo</p></div>
        <button type="button" className="stock-icon-button" aria-label="Fechar" disabled={ocupado} onClick={aoFechar}><X size={14} /></button>
      </header>
      {children}
    </dialog>
  )
}
