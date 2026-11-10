import { useState } from 'react'
import { mesAtual, mesPassado, ultimosMeses, validarPeriodo } from './periodoUtils'

const ATALHOS = [
  ['Este mês', mesAtual],
  ['Mês passado', mesPassado],
  ['Últimos 3 meses', (hoje) => ultimosMeses(hoje, 3)],
]

export default function Filtros({ de, ate, onChange, idPrefixo = 'periodo' }) {
  const [rascunho, setRascunho] = useState({ de, ate })
  const aviso = rascunho.de && rascunho.ate ? validarPeriodo(rascunho.de, rascunho.ate) : null

  function aplicar(periodo) {
    setRascunho(periodo)
    if (!validarPeriodo(periodo.de, periodo.ate)) onChange(periodo)
  }

  const hoje = new Date()

  return (
    <div className="filtros-periodo">
      <div className="filtros" role="group" aria-label="Atalhos de período">
        {ATALHOS.map(([texto, calcular]) => {
          const periodo = calcular(hoje)
          const ativo = periodo.de === rascunho.de && periodo.ate === rascunho.ate
          return (
            <button type="button" key={texto} aria-pressed={ativo} className={ativo ? 'active' : ''}
              onClick={() => aplicar(periodo)}>{texto}</button>
          )
        })}
      </div>
      <div className="datas-periodo">
        <label htmlFor={`${idPrefixo}-de`}>De</label>
        <input id={`${idPrefixo}-de`} type="date" value={rascunho.de}
          onChange={(evento) => aplicar({ ...rascunho, de: evento.target.value })} />
        <label htmlFor={`${idPrefixo}-ate`}>Até</label>
        <input id={`${idPrefixo}-ate`} type="date" value={rascunho.ate}
          onChange={(evento) => aplicar({ ...rascunho, ate: evento.target.value })} />
      </div>
      {aviso && <p className="aviso-periodo" role="alert">{aviso}</p>}
    </div>
  )
}
