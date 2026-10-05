import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Minus, Plus } from 'lucide-react'
import api from '../services/api'

const CHAVE_FONTE = 'doceterapia-font-scale'
const CHAVE_LIDAS = 'doceterapia-read-notifications'

function dataHoje() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function carregarLidas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_LIDAS) || '[]')
  } catch {
    return []
  }
}

export default function AppTopbar({ aoNavegar }) {
  const [pedidos, setPedidos] = useState([])
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const [lidas, setLidas] = useState(carregarLidas)
  const [escalaFonte, setEscalaFonte] = useState(() => {
    const salvo = Number(localStorage.getItem(CHAVE_FONTE))
    return Number.isFinite(salvo) && salvo >= 1 && salvo <= 1.8 ? salvo : 1
  })

  useEffect(() => {
    api.get('/pedidos')
      .then((resposta) => setPedidos(resposta.data || []))
      .catch((erro) => console.error('Não foi possível carregar as notificações:', erro))
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-zoom', escalaFonte)
    localStorage.setItem(CHAVE_FONTE, String(escalaFonte))
  }, [escalaFonte])

  const notificacoes = useMemo(() => pedidos
    .filter((pedido) => ['AGUARDANDO_SINAL', 'AGUARDANDO_PAGAMENTO', 'EM_PRODUCAO', 'AGUARDANDO_ENTREGA'].includes(pedido.statusPedido))
    .sort((a, b) => String(a.dataEntrega || '').localeCompare(String(b.dataEntrega || '')))
    .slice(0, 8)
    .map((pedido) => ({
      id: String(pedido.idPedido),
      pedido,
      titulo: `Pedido #${String(pedido.idPedido).padStart(4, '0')}`,
      descricao: textoNotificacao(pedido.statusPedido),
      destino: pedido.statusPedido === 'EM_PRODUCAO' || pedido.statusPedido === 'AGUARDANDO_ENTREGA' ? 'producao' : 'historico-pedidos',
    })), [pedidos])

  const naoLidas = notificacoes.filter((notificacao) => !lidas.includes(notificacao.id)).length

  function alterarEscala(variacao) {
    setEscalaFonte((atual) => Math.min(1.8, Math.max(1, Math.round((atual + variacao) * 100) / 100)))
  }

  function marcarTodasComoLidas() {
    const todasLidas = Array.from(new Set([...lidas, ...notificacoes.map((notificacao) => notificacao.id)]))
    setLidas(todasLidas)
    localStorage.setItem(CHAVE_LIDAS, JSON.stringify(todasLidas))
  }

  function abrirNotificacao(notificacao) {
    if (!lidas.includes(notificacao.id)) {
      const atualizadas = [...lidas, notificacao.id]
      setLidas(atualizadas)
      localStorage.setItem(CHAVE_LIDAS, JSON.stringify(atualizadas))
    }
    aoNavegar(notificacao.destino)
    setNotificacoesAbertas(false)
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
            <section className="notification-popover" aria-label="Notificações de pedidos">
              <header>
                <div><strong>Notificações</strong><span>{naoLidas} não lidas</span></div>
                <button type="button" onClick={marcarTodasComoLidas} disabled={!naoLidas} title="Marcar todas como lidas" aria-label="Marcar todas como lidas"><CheckCheck size={17} /></button>
              </header>
              <div className="notification-list">
                {notificacoes.map((notificacao) => (
                  <button className={`notification-item ${lidas.includes(notificacao.id) ? 'is-read' : ''}`} type="button" key={notificacao.id} onClick={() => abrirNotificacao(notificacao)}>
                    <span className="notification-dot" />
                    <span><strong>{notificacao.titulo}</strong><small>{notificacao.descricao}{notificacao.pedido.dataEntrega ? ` · entrega ${formatarData(notificacao.pedido.dataEntrega)}` : ''}</small></span>
                  </button>
                ))}
                {!notificacoes.length && <p className="notification-empty">Nenhum pedido requer atenção.</p>}
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
    </header>
  )
}

function textoNotificacao(status) {
  const mensagens = {
    AGUARDANDO_SINAL: 'Aguardando pagamento do sinal',
    AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
    EM_PRODUCAO: 'Pedido em produção',
    AGUARDANDO_ENTREGA: 'Pronto para entrega',
  }
  return mensagens[status] || 'Pedido atualizado'
}

function formatarData(data) {
  const [ano, mes, dia] = String(data).slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}` : data
}
