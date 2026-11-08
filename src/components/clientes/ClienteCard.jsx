import { useState } from 'react'
import { ChevronDown, MapPin, Pencil, Phone } from 'lucide-react'
import api from '../../services/api'

const classificacoes = {
  PADRAO: '',
  FREQUENTE: 'Cliente frequente',
  ALTO_VOLUME: 'Alto volume',
}
const TAMANHO_LOTE = 200
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function dataPedido(pedido) {
  return (pedido.dataCriacao || pedido.dataEntrega || '').slice(0, 10)
}
function formatarData(data) {
  return data ? new Date(`${data.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—'
}

async function buscarHistorico(idCliente) {
  const { data } = await api.get('/pedidos', { params: { clienteId: idCliente } })
  const pedidos = data || []
  const ids = pedidos.map((pedido) => pedido.idPedido)
  const lotes = []
  for (let inicio = 0; inicio < ids.length; inicio += TAMANHO_LOTE) {
    lotes.push(ids.slice(inicio, inicio + TAMANHO_LOTE).join(','))
  }
  const respostas = await Promise.all(
    lotes.map((pedidoId) => api.get('/itens-pedido', { params: { pedidoId } }))
  )

  return { pedidos, itens: respostas.flatMap((resposta) => resposta.data || []) }
}

export default function ClienteCard({ cliente, produtos, aoEditar }) {
  const [expandido, setExpandido] = useState(false)
  const [historico, setHistorico] = useState({ estado: 'ocioso', pedidos: [], itens: [] })
  const painelId = `cliente-pedidos-${cliente.idCliente}`

  async function carregarHistorico() {
    setHistorico({ estado: 'carregando', pedidos: [], itens: [] })
    try {
      const { pedidos, itens } = await buscarHistorico(cliente.idCliente)
      setHistorico({ estado: 'pronto', pedidos, itens })
    } catch {
      setHistorico({ estado: 'erro', pedidos: [], itens: [] })
    }
  }

  function alternar() {
    if (!expandido && historico.estado === 'ocioso') carregarHistorico()
    setExpandido(!expandido)
  }

  const ordenados = [...historico.pedidos].sort(
    (a, b) => dataPedido(b).localeCompare(dataPedido(a)) || b.idPedido - a.idPedido
  )
  const itensPedido = (id) => historico.itens.filter((item) => item.fkPedido === id)
  const totalPedido = (id) =>
    itensPedido(id).reduce((total, item) => total + Number(item.valorTotal || 0), 0)

  function descricaoPedido(idPedido) {
    const descricoes = itensPedido(idPedido).map((item) => {
      const produto = produtos.find((produto) => produto.idProduto === item.fkProduto)
      const nome = produto?.nome || 'Produto indisponível'
      const quantidade = Number(item.quantidade).toLocaleString('pt-BR')

      return `${nome} ×${quantidade}`
    })

    return descricoes.join(' + ') || 'Pedido sem itens'
  }

  return (
    <article className="expandable-card">
      <div className="client-row">
        <div className="client-data">
          <strong>{cliente.nome}</strong>
          <div>
            {cliente.tipoPessoa === 'JURIDICA' && (
              <span className="category-tag">Empresa</span>
            )}
            {classificacoes[cliente.classificacaoCliente] && (
              <span className={`client-tag ${cliente.classificacaoCliente}`}>
                {classificacoes[cliente.classificacaoCliente]}
              </span>
            )}
          </div>
          <small>
            <Phone size={13} />
            {cliente.telefone}
            <MapPin size={13} />
            {cliente.endereco}
          </small>
        </div>
        <div className="client-metric">
          <small>Pedidos</small>
          <b>{cliente.totalPedidos ?? 0}</b>
        </div>
        <div className="client-metric client-spent">
          <small>Gasto total</small>
          <b>{cliente.gastoTotal == null ? '—' : moeda.format(cliente.gastoTotal)}</b>
        </div>
        <div className="client-metric">
          <small>Último pedido</small>
          <span>{formatarData(cliente.ultimoPedido)}</span>
        </div>
        <button
          type="button"
          className="icon-action expand-action"
          aria-label={`${expandido ? 'Recolher' : 'Expandir'} ${cliente.nome}`}
          aria-expanded={expandido}
          aria-controls={painelId}
          onClick={alternar}
        >
          <ChevronDown size={17} className={expandido ? 'rotated' : ''} />
        </button>
        <button
          type="button"
          className="icon-action"
          onClick={aoEditar}
          aria-label={`Editar ${cliente.nome}`}
        >
          <Pencil size={17} />
        </button>
      </div>
      {expandido && (
        <section
          id={painelId}
          className="card-details client-order-details"
          aria-label={`Últimos pedidos de ${cliente.nome}`}
        >
          <p className="detail-description">Últimos pedidos</p>
          {historico.estado === 'carregando' && (
            <p className="detail-description client-history-status" role="status">
              Carregando pedidos...
            </p>
          )}
          {historico.estado === 'erro' && (
            <div className="client-history-status" role="alert">
              <p className="detail-description">
                Não foi possível carregar os pedidos deste cliente.
              </p>
              <button type="button" className="client-history-retry" onClick={carregarHistorico}>
                Tentar de novo
              </button>
            </div>
          )}
          {historico.estado === 'pronto' && (
            <>
              <div className="recent-orders">
                {ordenados.slice(0, 3).map((pedido) => (
                  <div className="recent-order" key={pedido.idPedido}>
                    <span className="recent-order-id">
                      #{String(pedido.idPedido).padStart(4, '0')}
                    </span>
                    <span className="recent-order-description">
                      {descricaoPedido(pedido.idPedido)}
                    </span>
                    <b>{moeda.format(totalPedido(pedido.idPedido))}</b>
                    <time dateTime={dataPedido(pedido)}>
                      {formatarData(dataPedido(pedido)).slice(0, 5)}
                    </time>
                  </div>
                ))}
              </div>
              {ordenados.length === 0 && (
                <p className="detail-description">Este cliente ainda não possui pedidos.</p>
              )}
            </>
          )}
        </section>
      )}
    </article>
  )
}
