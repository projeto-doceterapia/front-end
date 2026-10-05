import { useState } from 'react'
import { ChevronDown, MapPin, Pencil, Phone } from 'lucide-react'

const classificacoes = {
  PADRAO: '',
  FREQUENTE: 'Cliente frequente',
  ALTO_VOLUME: 'Alto volume',
}
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function dataPedido(pedido) {
  return (pedido.dataCriacao || pedido.dataEntrega || '').slice(0, 10)
}
function formatarData(data) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR') : '—'
}

export default function ClienteCard({ cliente, pedidos, itens, produtos, aoEditar }) {
  const [expandido, setExpandido] = useState(false)
  const ordenados = [...pedidos].sort(
    (a, b) => dataPedido(b).localeCompare(dataPedido(a)) || b.idPedido - a.idPedido
  )
  const itensPedido = (id) => itens.filter((item) => item.fkPedido === id)
  const totalPedido = (id) =>
    itensPedido(id).reduce((total, item) => total + Number(item.valorTotal || 0), 0)
  const gasto = pedidos.reduce((total, pedido) => total + totalPedido(pedido.idPedido), 0)
  const painelId = `cliente-pedidos-${cliente.idCliente}`

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
          <b>{pedidos.length}</b>
        </div>
        <div className="client-metric client-spent">
          <small>Gasto total</small>
          <b>{moeda.format(gasto)}</b>
        </div>
        <div className="client-metric">
          <small>Último pedido</small>
          <span>{formatarData(ordenados[0] ? dataPedido(ordenados[0]) : '')}</span>
        </div>
        <button
          type="button"
          className="icon-action expand-action"
          aria-label={`${expandido ? 'Recolher' : 'Expandir'} ${cliente.nome}`}
          aria-expanded={expandido}
          aria-controls={painelId}
          onClick={() => setExpandido(!expandido)}
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
        </section>
      )}
    </article>
  )
}
