import { useId } from 'react'

export default function CampoPedido({ rotulo, obrigatorio = false, erro, ajuda, larguraTotal = false, children }) {
  const id = useId()
  const idErro = `${id}-erro`
  const idAjuda = `${id}-ajuda`
  const descricao = [erro && idErro, ajuda && idAjuda].filter(Boolean).join(' ') || undefined

  return (
    <div className={`order-data-field${larguraTotal ? ' full-width' : ''}`}>
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className="campo-obrigatorio"> (obrigatório)</span>}
      </label>
      {children({ id, 'aria-invalid': erro ? true : undefined, 'aria-describedby': descricao, required: obrigatorio || undefined })}
      {ajuda && <small id={idAjuda} className="campo-ajuda">{ajuda}</small>}
      {erro && <small id={idErro} className="campo-erro">{erro}</small>}
    </div>
  )
}
