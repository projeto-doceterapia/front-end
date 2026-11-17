import { useId, useState } from 'react'
import { formatarDataCompleta, STATUS_AGENDA, validarFiltro } from './filtrosUtils'

export default function FiltroPeriodoPedidos(props) {
  const { filtro } = props
  return <FormularioPeriodo key={`${filtro.de}|${filtro.ate}|${filtro.status.join(',')}`} {...props} />
}

function FormularioPeriodo({ filtro, opcoesStatus = [], exigeStatus = false, opcaoCancelados = false, carregando = false, onAplicar, onRestaurar }) {
  const [rascunho, setRascunho] = useState(filtro)
  const [erro, setErro] = useState('')
  const id = useId()
  const idErro = `${id}-erro`
  const descricao = erro ? idErro : undefined

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
  }

  function alternarStatus(valor, marcado) {
    alterar('status', marcado ? [...rascunho.status, valor] : rascunho.status.filter((status) => status !== valor))
  }

  function aplicar(evento) {
    evento.preventDefault()
    const mensagem = validarFiltro(rascunho, { exigeStatus })
    setErro(mensagem || '')
    if (!mensagem) onAplicar(rascunho)
  }

  return (
    <form className="period-filter" aria-label="Filtrar pedidos por período" onSubmit={aplicar} noValidate>
      <div className="period-filter-fields">
        <label htmlFor={`${id}-de`}>De</label>
        <input id={`${id}-de`} type="date" value={rascunho.de} onChange={(evento) => alterar('de', evento.target.value)} aria-describedby={descricao} aria-invalid={!!erro} />
        <label htmlFor={`${id}-ate`}>Até</label>
        <input id={`${id}-ate`} type="date" value={rascunho.ate} onChange={(evento) => alterar('ate', evento.target.value)} aria-describedby={descricao} aria-invalid={!!erro} />
        {opcaoCancelados && (
          <label className="period-filter-check">
            <input type="checkbox" checked={!rascunho.status.length} onChange={(evento) => alterar('status', evento.target.checked ? [] : STATUS_AGENDA)} />
            Incluir cancelados
          </label>
        )}
      </div>
      {opcoesStatus.length > 0 && (
        <fieldset className="period-filter-stages" aria-describedby={descricao}>
          <legend>Etapas</legend>
          {opcoesStatus.map(([valor, rotulo]) => (
            <label className="period-filter-check" key={valor}>
              <input type="checkbox" checked={rascunho.status.includes(valor)} onChange={(evento) => alternarStatus(valor, evento.target.checked)} />
              {rotulo}
            </label>
          ))}
        </fieldset>
      )}
      <div className="period-filter-actions">
        <button type="submit" className="primary-button" disabled={carregando}>Aplicar</button>
        <button type="button" className="outline-button" onClick={onRestaurar}>Restaurar padrão</button>
        <span className="period-filter-current">Mostrando entregas de {formatarDataCompleta(filtro.de)} a {formatarDataCompleta(filtro.ate)}</span>
      </div>
      {erro && <p id={idErro} className="period-filter-error" role="alert">{erro}</p>}
    </form>
  )
}
