import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const DURACAO_SUCESSO_MS = 5000

export default function AvisoToast({ id, tipo, mensagem, onFechar }) {
  const [mouseDentro, setMouseDentro] = useState(false)
  const [focoDentro, setFocoDentro] = useState(false)
  const tempoRestante = useRef(DURACAO_SUCESSO_MS)
  const contando = tipo === 'sucesso' && !mouseDentro && !focoDentro

  useEffect(() => {
    if (!contando) return undefined
    const inicio = Date.now()
    const temporizador = setTimeout(() => onFechar(id), tempoRestante.current)
    return () => {
      clearTimeout(temporizador)
      tempoRestante.current -= Date.now() - inicio
    }
  }, [contando, id, onFechar])

  return (
    <div
      className={`toast toast-${tipo}`}
      onMouseEnter={() => setMouseDentro(true)}
      onMouseLeave={() => setMouseDentro(false)}
      onFocus={() => setFocoDentro(true)}
      onBlur={() => setFocoDentro(false)}
    >
      <p>{mensagem}</p>
      <button
        type="button"
        className="toast-fechar"
        aria-label="Fechar aviso"
        data-aviso-id={id}
        onClick={() => onFechar(id)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
