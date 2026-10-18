import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, Minus, Plus, Settings } from 'lucide-react'
import {
  assinarStream,
  listarNaoLidas,
  marcarComoLida,
} from '../services/notificacoes'
import ConfiguracaoNotificacao from './notificacoes/ConfiguracaoNotificacao'

const CHAVE_FONTE = 'doceterapia-font-scale'

function dataHoje() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function formatarData(data) {
  if (!data) return ''
  const [ano, mes, dia] = String(data).slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}` : ''
}

export default function AppTopbar() {
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const [configAberta, setConfigAberta] = useState(false)
  const [escalaFonte, setEscalaFonte] = useState(() => {
    const salvo = Number(localStorage.getItem(CHAVE_FONTE))
    return Number.isFinite(salvo) && salvo >= 1 && salvo <= 1.8 ? salvo : 1
  })

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    return listarNaoLidas()
      .then((lista) => setNotificacoes(lista))
      .catch(() => setErro('Não foi possível carregar as notificações.'))
      .finally(() => setCarregando(false))
  }, [])

  const removerNotificacao = useCallback((id) => {
    setNotificacoes((atuais) => atuais.filter((item) => item.idNotificacao !== id))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    const encerrar = assinarStream({
      aoNotificar: (notificacao) => setNotificacoes((atuais) => (
        atuais.some((item) => item.idNotificacao === notificacao.idNotificacao)
          ? atuais
          : [notificacao, ...atuais]
      )),
      aoMarcarLida: (id) => removerNotificacao(id),
      aoReconectar: carregar,
    })
    return encerrar
  }, [carregar, removerNotificacao])

  useEffect(() => {
    function aoFocar() {
      if (document.visibilityState === 'visible') {
        carregar()
      }
    }
    document.addEventListener('visibilitychange', aoFocar)
    return () => document.removeEventListener('visibilitychange', aoFocar)
  }, [carregar])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-zoom', escalaFonte)
    localStorage.setItem(CHAVE_FONTE, String(escalaFonte))
  }, [escalaFonte])

  const naoLidas = notificacoes.length

  function alterarEscala(variacao) {
    setEscalaFonte((atual) => Math.min(1.8, Math.max(1, Math.round((atual + variacao) * 100) / 100)))
  }

  function marcar(id) {
    removerNotificacao(id)
    marcarComoLida(id).catch(() => carregar())
  }

  function marcarTodasComoLidas() {
    const ids = notificacoes.map((item) => item.idNotificacao)
    setNotificacoes([])
    Promise.allSettled(ids.map((id) => marcarComoLida(id))).then((resultados) => {
      if (resultados.some((resultado) => resultado.status === 'rejected')) {
        carregar()
      }
    })
  }

  return (
    <header className="app-topbar">
      <span className="topbar-date">Hoje, {dataHoje()}</span>
      <div className="topbar-actions">
        <div className="notification-wrap">
          <button
            className="topbar-icon-button notification-button"
            type="button"
            aria-label={naoLidas ? `${naoLidas} notificações não lidas` : 'Notificações'}
            aria-expanded={notificacoesAbertas}
            onClick={() => setNotificacoesAbertas((abertas) => !abertas)}
          >
            <Bell size={19} />
            {naoLidas > 0 && <span className="notification-count">{naoLidas > 9 ? '9+' : naoLidas}</span>}
          </button>
          {notificacoesAbertas && (
            <section className="notification-popover" aria-label="Notificações">
              <header>
                <div><strong>Notificações</strong><span>{naoLidas} não lidas</span></div>
                <div className="notification-popover-actions">
                  <button
                    type="button"
                    onClick={() => { setConfigAberta(true); setNotificacoesAbertas(false) }}
                    title="Configurar notificações"
                    aria-label="Configurar notificações"
                  >
                    <Settings size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={marcarTodasComoLidas}
                    disabled={!naoLidas}
                    title="Marcar todas como lidas"
                    aria-label="Marcar todas como lidas"
                  >
                    <CheckCheck size={17} />
                  </button>
                </div>
              </header>
              <div className="notification-list">
                {carregando && <p className="notification-empty" role="status">Carregando notificações...</p>}
                {!carregando && erro && <p className="notification-empty notification-error" role="alert">{erro}</p>}
                {!carregando && !erro && notificacoes.map((notificacao) => (
                  <button
                    className="notification-item"
                    type="button"
                    key={notificacao.idNotificacao}
                    onClick={() => marcar(notificacao.idNotificacao)}
                    aria-label={`Marcar "${notificacao.titulo}" como lida`}
                  >
                    <span className="notification-dot" />
                    <span>
                      <strong>{notificacao.titulo}</strong>
                      <small>
                        {notificacao.mensagem}
                        {notificacao.dataCriacao ? ` · ${formatarData(notificacao.dataCriacao)}` : ''}
                      </small>
                    </span>
                  </button>
                ))}
                {!carregando && !erro && !notificacoes.length && (
                  <p className="notification-empty">Nenhuma notificação não lida.</p>
                )}
              </div>
            </section>
          )}
        </div>
        <div className="font-size-controls" aria-label="Tamanho da fonte">
          <button type="button" onClick={() => alterarEscala(-0.2)} disabled={escalaFonte <= 1} aria-label="Diminuir fonte" title="Diminuir fonte"><Minus size={13} /></button>
          <span>Aa <small>{Math.round(escalaFonte * 100)}%</small></span>
          <button type="button" onClick={() => alterarEscala(0.2)} disabled={escalaFonte >= 1.8} aria-label="Aumentar fonte" title="Aumentar fonte"><Plus size={13} /></button>
        </div>
        <div className="topbar-user" aria-label="Administrador, Gestor">
          <b>A</b>
          <span>Administrador<small>Gestor</small></span>
        </div>
      </div>
      {configAberta && <ConfiguracaoNotificacao aoFechar={() => setConfigAberta(false)} />}
    </header>
  )
}
