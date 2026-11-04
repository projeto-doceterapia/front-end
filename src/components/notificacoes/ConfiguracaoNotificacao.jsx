import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../../services/api'
import useAvisoLocal from './useAvisoLocal'

const DIAS = [
  { valor: 'MONDAY', rotulo: 'Segunda' },
  { valor: 'TUESDAY', rotulo: 'Terça' },
  { valor: 'WEDNESDAY', rotulo: 'Quarta' },
  { valor: 'THURSDAY', rotulo: 'Quinta' },
  { valor: 'FRIDAY', rotulo: 'Sexta' },
  { valor: 'SATURDAY', rotulo: 'Sábado' },
  { valor: 'SUNDAY', rotulo: 'Domingo' },
]

const INTERRUPTORES = [
  { campo: 'assistenteAtivo', rotulo: 'Assistente ativo', ajuda: 'Pausa conversa, leitura de notas e avisos.' },
  { campo: 'avisosAutomaticosAtivo', rotulo: 'Avisos automáticos', ajuda: 'Pausa só os avisos no WhatsApp. Eles continuam no sino.' },
]

// Long enough to read the confirmation before the window closes.
const ESPERA_FECHAR_MS = 1500

const TEXTO_TESTE_PENDENTE = 'Notificação de teste criada. Ela aparece no sino e chega ao WhatsApp em instantes.'
const TEXTO_TESTE_SO_SINO = 'Notificação de teste criada só no sino. Salve com o assistente e os avisos automáticos ligados para testar o WhatsApp.'

const ALERTAS = [
  { campo: 'resumoInicioDiaAtivo', rotulo: 'Resumo de início do dia' },
  { campo: 'resumoFimDiaAtivo', rotulo: 'Resumo de fim do dia' },
  { campo: 'estoqueBaixoAtivo', rotulo: 'Alerta de estoque baixo' },
  { campo: 'diaLotadoAtivo', rotulo: 'Alerta de dia lotado' },
]

function rotuloBotaoTeste(enviando, segundos) {
  if (enviando) return 'Enviando...'
  if (segundos > 0) return `Aguarde ${segundos} s para testar de novo`
  return 'Enviar notificação de teste'
}

export default function ConfiguracaoNotificacao({ aoFechar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregar, setErroCarregar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [enviandoTeste, setEnviandoTeste] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const avisos = useAvisoLocal()

  useEffect(() => {
    let ativo = true
    api.get('/configuracao-notificacao')
      .then((resposta) => { if (ativo) setDados(resposta.data) })
      .catch(() => { if (ativo) setErroCarregar('Não foi possível carregar as configurações.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!salvo) return undefined
    const temporizador = setTimeout(aoFechar, ESPERA_FECHAR_MS)
    return () => clearTimeout(temporizador)
  }, [salvo, aoFechar])

  useEffect(() => {
    if (segundosRestantes <= 0) return undefined
    const temporizador = setTimeout(() => setSegundosRestantes((atuais) => atuais - 1), 1000)
    return () => clearTimeout(temporizador)
  }, [segundosRestantes])

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

  async function enviarTeste() {
    setEnviandoTeste(true)
    avisos.limpar()
    try {
      const resposta = await api.post('/notificacoes/teste')
      avisos.sucesso(resposta.data?.statusEnvio === 'NAO_ENVIAR' ? TEXTO_TESTE_SO_SINO : TEXTO_TESTE_PENDENTE)
    } catch (erroRequisicao) {
      setSegundosRestantes(erroRequisicao.response?.data?.segundosRestantes || 0)
      avisos.erro(erroRequisicao.response?.data?.message || 'Não foi possível enviar a notificação de teste. Tente novamente.')
    } finally {
      setEnviandoTeste(false)
    }
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!dados.diasExpediente?.length) {
      avisos.erro('Selecione ao menos um dia de expediente.')
      return
    }

    setSalvando(true)
    avisos.limpar()
    try {
      const resposta = await api.put('/configuracao-notificacao', {
        ...dados,
        diasAntecedencia: Number(dados.diasAntecedencia),
      })
      setDados(resposta.data)
      avisos.sucesso('Configurações salvas.')
      setSalvo(true)
    } catch (erroRequisicao) {
      avisos.erro(erroRequisicao.response?.data?.message || 'Não foi possível salvar as configurações. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const avisosPausados = dados?.avisosAutomaticosAtivo === false || dados?.assistenteAtivo === false

  return (
    <div className="farol-overlay config-notificacao-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-config-notificacao">
      <form className="farol-modal" onSubmit={salvar}>
        <header>
          <div>
            <h2 id="titulo-config-notificacao">Configurar notificações</h2>
            <p>Defina o expediente, os resumos diários e os alertas ativos.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        {carregando && <p className="config-notificacao-grupo" role="status">Carregando configurações...</p>}
        {!carregando && erroCarregar && <p className="form-error" role="alert">{erroCarregar}</p>}

        {!carregando && !erroCarregar && !dados && (
          <p className="config-notificacao-grupo" role="status">Nenhuma configuração encontrada.</p>
        )}

        {!carregando && !erroCarregar && dados && (
          <>
            <fieldset className="config-notificacao-grupo config-notificacao-assistente">
              <legend>Assistente</legend>
              {INTERRUPTORES.map((interruptor) => (
                <div key={interruptor.campo} className="config-notificacao-interruptor">
                  <label className="config-notificacao-check">
                    <input
                      name={interruptor.campo}
                      type="checkbox"
                      checked={Boolean(dados[interruptor.campo])}
                      onChange={alterarCampo}
                      aria-describedby={`ajuda-${interruptor.campo}`}
                    />
                    <span>{interruptor.rotulo}</span>
                  </label>
                  <small id={`ajuda-${interruptor.campo}`}>{interruptor.ajuda}</small>
                </div>
              ))}
            </fieldset>

            <div className="config-notificacao-grupo">
              <label className="config-notificacao-horario">Início do expediente
                <input name="inicioExpediente" type="time" value={dados.inicioExpediente} onChange={alterarCampo} />
              </label>
              <label className="config-notificacao-horario">Fim do expediente
                <input name="fimExpediente" type="time" value={dados.fimExpediente} onChange={alterarCampo} />
              </label>
              <label className="config-notificacao-horario">Horário do resumo de início
                <input name="horarioResumoInicio" type="time" value={dados.horarioResumoInicio} onChange={alterarCampo} />
              </label>
              <label className="config-notificacao-horario">Horário do resumo de fim
                <input name="horarioResumoFim" type="time" value={dados.horarioResumoFim} onChange={alterarCampo} />
              </label>
              <label className="config-notificacao-horario">Dias de antecedência
                <input name="diasAntecedencia" type="number" min="1" max="14" value={dados.diasAntecedencia} onChange={alterarCampo} />
                <small>Pedidos considerados no resumo de fim do dia (1 a 14).</small>
              </label>
            </div>

            <fieldset className="config-notificacao-grupo">
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

            <fieldset className="config-notificacao-grupo">
              <legend>Alertas ativos</legend>
              {avisosPausados && (
                <p className="config-notificacao-ajuda">Pausados pelo assistente ou pelos avisos automáticos. Os valores ficam guardados.</p>
              )}
              {ALERTAS.map((alerta) => (
                <label key={alerta.campo} className="config-notificacao-check">
                  <input
                    name={alerta.campo}
                    type="checkbox"
                    checked={Boolean(dados[alerta.campo])}
                    onChange={alterarCampo}
                    disabled={avisosPausados}
                  />
                  <span>{alerta.rotulo}</span>
                </label>
              ))}
            </fieldset>

            <div className="config-notificacao-teste">
              <button
                type="button"
                className="outline-button"
                onClick={enviarTeste}
                disabled={avisosPausados || enviandoTeste || segundosRestantes > 0}
                aria-describedby={avisosPausados ? 'ajuda-teste-notificacao' : undefined}
              >
                {rotuloBotaoTeste(enviandoTeste, segundosRestantes)}
              </button>
              {avisosPausados && (
                <small id="ajuda-teste-notificacao" className="config-notificacao-ajuda">
                  Ligue o assistente e os avisos automáticos para testar o WhatsApp.
                </small>
              )}
            </div>

            {avisos.aviso?.tipo === 'erro' && <p className="form-error" role="alert">{avisos.aviso.texto}</p>}
            {avisos.aviso?.tipo === 'sucesso' && <p className="config-notificacao-sucesso" role="status">{avisos.aviso.texto}</p>}
            <footer>
              <button type="button" className="outline-button" onClick={aoFechar}>Cancelar</button>
              <button className="primary-button" disabled={salvando || salvo}>{salvando ? 'Salvando...' : 'Salvar configuração'}</button>
            </footer>
          </>
        )}
      </form>
    </div>
  )
}
