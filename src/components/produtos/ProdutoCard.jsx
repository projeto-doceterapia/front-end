import { useEffect, useState } from 'react'
import {
  ChevronDown,
  CookingPot,
  DollarSign,
  Pencil,
  Tag,
  TrendingUp,
} from 'lucide-react'
import api from '../../services/api'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function quantidadeInsumo(insumo) {
  const quantidade = Number(insumo.quantidadeUtilizada || 0)

  if (insumo.unidade === 'KG') {
    return `${(quantidade * 1000).toLocaleString('pt-BR')}g`
  }

  if (insumo.unidade === 'L') {
    return `${(quantidade * 1000).toLocaleString('pt-BR')}ml`
  }

  const unidade =
    insumo.unidade === 'UNIDADE' ? 'un.' : (insumo.unidade || '').toLowerCase()

  return `${quantidade.toLocaleString('pt-BR')} ${unidade}`
}

export default function ProdutoCard({ produto, aoEditar }) {
  const [expandido, setExpandido] = useState(false)
  const [insumos, setInsumos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true

    api
      .get(`/produtos/${produto.idProduto}/insumos`)
      .then((resposta) => {
        if (ativo) {
          setInsumos(resposta.data || [])
          setErro(false)
        }
      })
      .catch(() => {
        if (ativo) {
          setErro(true)
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false)
        }
      })

    return () => {
      ativo = false
    }
  }, [produto.idProduto])

  const preco = Number(produto.precoAtual || 0)
  const lucro = preco - Number(produto.custoEstimado || 0)
  const margem = preco > 0 ? (lucro / preco) * 100 : 0
  const painelId = `produto-detalhes-${produto.idProduto}`

  return (
    <article className="expandable-card">
      <div className="catalog-row">
        <span className="catalog-icon">
          <CookingPot size={21} />
        </span>
        <div className="catalog-info">
          <strong>{produto.nome}</strong>
          <div>
            <span className="category-tag">
              <Tag size={11} />
              {produto.categoriaNome || 'Sem categoria'}
            </span>
            <small>
              {carregando
                ? 'Carregando insumos...'
                : erro
                  ? 'Insumos indisponíveis'
                  : `${insumos.length} insumos`}
            </small>
          </div>
        </div>
        <div className="product-price">
          <small>Preço</small>
          <b>{moeda.format(preco)}</b>
        </div>
        <button
          type="button"
          className="icon-action expand-action"
          aria-label={`${expandido ? 'Recolher' : 'Expandir'} ${produto.nome}`}
          aria-expanded={expandido}
          aria-controls={painelId}
          onClick={() => setExpandido(!expandido)}
        >
          <ChevronDown size={17} className={expandido ? 'rotated' : ''} />
        </button>
        <button
          type="button"
          className="icon-action"
          aria-label={`Editar ${produto.nome}`}
          onClick={aoEditar}
        >
          <Pencil size={17} />
        </button>
      </div>
      {expandido && (
        <div id={painelId} className="card-details product-details">
          <p className="detail-description">
            {produto.descricao || 'Produto sem descrição cadastrada.'}
          </p>
          <div className="ingredient-chips">
            {insumos.map((insumo) => (
              <span key={insumo.idProdutoInsumo}>
                {insumo.nomeInsumo} — {quantidadeInsumo(insumo)}
              </span>
            ))}
          </div>
          {carregando && (
            <p className="detail-description" role="status">
              Carregando insumos...
            </p>
          )}
          {erro && (
            <p className="detail-description" role="alert">
              Não foi possível carregar os insumos.
            </p>
          )}
          {!carregando && !erro && insumos.length === 0 && (
            <p className="detail-description">Nenhum insumo cadastrado.</p>
          )}
          <section
            className={`pricing-panel ${lucro < 0 ? 'negative' : ''}`}
            aria-label="Precificação estimada"
          >
            <header>
              <span>
                <DollarSign size={14} /> Precificação estimada
              </span>
              <span className="margin-badge">
                {lucro > 0
                  ? 'Margem positiva'
                  : lucro < 0
                    ? 'Margem negativa'
                    : 'Sem margem'}
              </span>
            </header>
            <div className="pricing-grid">
              <div>
                <small>Custo estimado</small>
                <span>{moeda.format(produto.custoEstimado || 0)}</span>
              </div>
              <div>
                <small>Preço sugerido</small>
                <span className="suggested-price">
                  {moeda.format(produto.precoSugerido || 0)}
                </span>
              </div>
              <div>
                <small>Preço atual</small>
                <span>{moeda.format(preco)}</span>
              </div>
              <div>
                <small>Lucro estimado</small>
                <span className="profit-value">
                  {lucro > 0 ? '+' : ''}
                  {moeda.format(lucro)}
                </span>
              </div>
            </div>
            <div className="margin-progress">
              <div className="margin-track">
                <span style={{ width: `${Math.min(100, Math.max(0, margem))}%` }} />
              </div>
              <span>{Math.round(margem)}%</span>
              <TrendingUp size={13} />
            </div>
          </section>
        </div>
      )}
    </article>
  )
}
