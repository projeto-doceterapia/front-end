import { useCallback, useMemo, useRef, useState } from 'react'
import AvisoToast from './AvisoToast'
import toastContext from './toastContext'
import '../../styles/feedback.css'

const LIMITE_AVISOS = 5

export default function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const avisosAtuais = useRef([])
  const proximoId = useRef(1)
  const regiao = useRef(null)

  const publicar = useCallback((lista) => {
    avisosAtuais.current = lista
    setAvisos(lista)
  }, [])

  const moverFocoDoAviso = useCallback((id) => {
    const botoes = [...regiao.current.querySelectorAll('.toast-fechar')]
    const indice = botoes.indexOf(document.activeElement)
    if (indice === -1 || botoes[indice].dataset.avisoId !== String(id)) return
    const destino = botoes[indice + 1] ?? botoes[indice - 1]
    destino?.focus()
  }, [])

  const fechar = useCallback((id) => {
    moverFocoDoAviso(id)
    publicar(avisosAtuais.current.filter((aviso) => aviso.id !== id))
  }, [moverFocoDoAviso, publicar])

  const adicionar = useCallback((tipo, mensagem) => {
    const lista = [...avisosAtuais.current, { id: proximoId.current++, tipo, mensagem }]
    const excedentes = lista.slice(0, Math.max(0, lista.length - LIMITE_AVISOS))
    excedentes.forEach((aviso) => moverFocoDoAviso(aviso.id))
    publicar(lista.slice(excedentes.length))
  }, [moverFocoDoAviso, publicar])

  const toast = useMemo(() => ({
    sucesso: (mensagem) => adicionar('sucesso', mensagem),
    erro: (mensagem) => adicionar('erro', mensagem),
  }), [adicionar])

  function renderizarAvisos(tipo) {
    return avisos
      .filter((aviso) => aviso.tipo === tipo)
      .map((aviso) => <AvisoToast key={aviso.id} {...aviso} onFechar={fechar} />)
  }

  return (
    <toastContext.Provider value={toast}>
      {children}
      {/* Screen readers only announce changes in live regions that already exist, so both stay mounted while empty. */}
      <section ref={regiao} className="toast-region" aria-label="Avisos">
        <div role="status" aria-live="polite">{renderizarAvisos('sucesso')}</div>
        <div role="alert" aria-live="assertive">{renderizarAvisos('erro')}</div>
      </section>
    </toastContext.Provider>
  )
}
