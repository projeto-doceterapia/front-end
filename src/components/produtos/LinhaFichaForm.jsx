import { useId, useState } from 'react'
import { numeroDecimal, unidades } from '../estoque/estoqueUtils'
import { unidadesCompativeis } from './precificacaoUtils'
import '../../styles/produtos.css'

const QUANTIDADE_MINIMA = 0.001

export default function LinhaFichaForm({ insumos, inicial, ocupado, onSalvar, onCancelar }) {
  const idBase = useId()
  const [fkInsumo, setFkInsumo] = useState(inicial?.fkInsumo ?? '')
  const [quantidade, setQuantidade] = useState(inicial?.quantidade ?? '')
  const [unidade, setUnidade] = useState(inicial?.unidade ?? '')
  const [erroQuantidade, setErroQuantidade] = useState('')
  const [erroUnidade, setErroUnidade] = useState('')

  if (insumos === null) {
    return <p className="ficha-estado" role="status">Carregando insumos disponíveis...</p>
  }

  const insumo = insumos.find((item) => String(item.idInsumo) === String(fkInsumo))
  const opcoesUnidade = insumo ? unidadesCompativeis(insumo.unidade) : []

  function escolherInsumo(valor) {
    const escolhido = insumos.find((item) => String(item.idInsumo) === valor)
    setFkInsumo(valor)
    setUnidade(escolhido ? escolhido.unidade : '')
    setErroUnidade('')
  }

  async function enviar(event) {
    event.preventDefault()
    const valor = numeroDecimal(quantidade)
    if (!Number.isFinite(valor) || valor < QUANTIDADE_MINIMA) {
      setErroQuantidade('Informe uma quantidade maior que zero.')
      return
    }
    setErroQuantidade('')

    const resultado = await onSalvar({
      fkInsumo: Number(fkInsumo),
      quantidadeUtilizada: Number(valor.toFixed(3)),
      unidade,
    })
    if (resultado?.erroUnidade) setErroUnidade(resultado.erroUnidade)
  }

  return (
    <form className="ficha-form" onSubmit={enviar}>
      <div className="campo">
        <label htmlFor={`${idBase}-insumo`}>Insumo</label>
        <select
          id={`${idBase}-insumo`}
          autoFocus
          required
          value={fkInsumo}
          onChange={(e) => escolherInsumo(e.target.value)}
        >
          <option value="">Selecione</option>
          {insumos.map((item) => (
            <option value={item.idInsumo} key={item.idInsumo}>
              {item.nome} ({unidades[item.unidade] ?? item.unidade})
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor={`${idBase}-quantidade`}>Quantidade</label>
        <input
          id={`${idBase}-quantidade`}
          inputMode="decimal"
          required
          value={quantidade}
          aria-invalid={erroQuantidade ? 'true' : undefined}
          aria-describedby={erroQuantidade ? `${idBase}-erro-quantidade` : undefined}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        {erroQuantidade && (
          <small id={`${idBase}-erro-quantidade`} className="campo-erro">{erroQuantidade}</small>
        )}
      </div>
      <div className="campo">
        <label htmlFor={`${idBase}-unidade`}>Unidade</label>
        <select
          id={`${idBase}-unidade`}
          required
          disabled={!insumo}
          value={unidade}
          aria-invalid={erroUnidade ? 'true' : undefined}
          aria-describedby={erroUnidade ? `${idBase}-erro-unidade` : undefined}
          onChange={(e) => {
            setUnidade(e.target.value)
            setErroUnidade('')
          }}
        >
          {!insumo && <option value="">Escolha o insumo</option>}
          {opcoesUnidade.map((opcao) => (
            <option value={opcao} key={opcao}>{unidades[opcao]}</option>
          ))}
        </select>
        {erroUnidade && (
          <small id={`${idBase}-erro-unidade`} className="campo-erro">{erroUnidade}</small>
        )}
      </div>
      <div className="ficha-form-acoes">
        <button type="button" className="outline-button" onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </button>
        <button className="primary-button" disabled={ocupado}>
          {ocupado ? 'Salvando...' : 'Salvar insumo'}
        </button>
      </div>
    </form>
  )
}
