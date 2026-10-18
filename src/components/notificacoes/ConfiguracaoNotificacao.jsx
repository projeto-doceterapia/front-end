import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../../services/api'

const DIAS = [
  { valor: 'MONDAY', rotulo: 'Segunda' },
  { valor: 'TUESDAY', rotulo: 'Terça' },
  { valor: 'WEDNESDAY', rotulo: 'Quarta' },
  { valor: 'THURSDAY', rotulo: 'Quinta' },
  { valor: 'FRIDAY', rotulo: 'Sexta' },
  { valor: 'SATURDAY', rotulo: 'Sábado' },
  { valor: 'SUNDAY', rotulo: 'Domingo' },
]

const ALERTAS = [
  { campo: 'resumoInicioDiaAtivo', rotulo: 'Resumo de início do dia' },
  { campo: 'resumoFimDiaAtivo', rotulo: 'Resumo de fim do dia' },
  { campo: 'estoqueBaixoAtivo', rotulo: 'Alerta de estoque baixo' },
  { campo: 'diaLotadoAtivo', rotulo: 'Alerta de dia lotado' },
]

export default function ConfiguracaoNotificacao({ aoFechar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregar, setErroCarregar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    api.get('/configuracao-notificacao')
      .then((resposta) => { if (ativo) setDados(resposta.data) })
      .catch(() => { if (ativo) setErroCarregar('Não foi possível carregar as configurações.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target
    setDados((atuais) => ({ ...atuais, [name]: type === 'checkbox' ? checked : value }))
  }

  function alternarDia(dia) {
    setDados((atuais) => {
      const selecionados = atuais.diasExpediente || []
      return {
        ...atuais,
        diasExpediente: selecionados.includes(dia)
          ? selecionados.filter((item) => item !== dia)
          : [...selecionados, dia],
      }
    })
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!dados.diasExpediente?.length) {
      setErro('Selecione ao menos um dia de expediente.')
      return
    }

    setSalvando(true)
    setErro('')
    try {
      const resposta = await api.put('/configuracao-notificacao', {
        ...dados,
        diasAntecedencia: Number(dados.diasAntecedencia),
      })
      setDados(resposta.data)
      aoFechar()
    } catch (erroRequisicao) {
      setErro(erroRequisicao.response?.data?.message || 'Não foi possível salvar as configurações. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="farol-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-config-notificacao">
      <form className="farol-modal" onSubmit={salvar}>
        <header>
          <div>
            <h2 id="titulo-config-notificacao">Configurar notificações</h2>
            <p>Defina o expediente, os resumos diários e os alertas ativos.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        {carregando && <p className="farol-fields" role="status">Carregando configurações...</p>}
        {!carregando && erroCarregar && <p className="form-error" role="alert">{erroCarregar}</p>}

        {!carregando && !erroCarregar && dados && (
          <>
            <div className="farol-fields">
              <label>Início do expediente
                <input name="inicioExpediente" type="time" value={dados.inicioExpediente} onChange={alterarCampo} />
              </label>
              <label>Fim do expediente
                <input name="fimExpediente" type="time" value={dados.fimExpediente} onChange={alterarCampo} />
              </label>
              <label>Horário do resumo de início
                <input name="horarioResumoInicio" type="time" value={dados.horarioResumoInicio} onChange={alterarCampo} />
              </label>
              <label>Horário do resumo de fim
                <input name="horarioResumoFim" type="time" value={dados.horarioResumoFim} onChange={alterarCampo} />
              </label>
              <label>Dias de antecedência
                <input name="diasAntecedencia" type="number" min="1" max="14" value={dados.diasAntecedencia} onChange={alterarCampo} />
                <small>Pedidos considerados no resumo de fim do dia (1 a 14).</small>
              </label>
            </div>

            <fieldset className="farol-fields">
              <legend>Dias de expediente</legend>
              {DIAS.map((dia) => (
                <label key={dia.valor} className="config-notificacao-check">
                  <input
                    type="checkbox"
                    checked={(dados.diasExpediente || []).includes(dia.valor)}
                    onChange={() => alternarDia(dia.valor)}
                  />
                  {dia.rotulo}
                </label>
              ))}
            </fieldset>

            <fieldset className="farol-fields">
              <legend>Alertas ativos</legend>
              {ALERTAS.map((alerta) => (
                <label key={alerta.campo} className="config-notificacao-check">
                  <input
                    name={alerta.campo}
                    type="checkbox"
                    checked={Boolean(dados[alerta.campo])}
                    onChange={alterarCampo}
                  />
                  {alerta.rotulo}
                </label>
              ))}
            </fieldset>

            {erro && <p className="form-error" role="alert">{erro}</p>}
            <footer>
              <button type="button" className="outline-button" onClick={aoFechar}>Cancelar</button>
              <button className="primary-button" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar configuração'}</button>
            </footer>
          </>
        )}
      </form>
    </div>
  )
}
