import { useState } from 'react'
import {
  ChevronDown,
  CookingPot,
  DollarSign,
  Pencil,
  Tag,
  TrendingUp,
} from 'lucide-react'
import useSessao from '../sessao/useSessao'
import FichaTecnica from './FichaTecnica'
import useFichaTecnica from './useFichaTecnica'
import {
  formatarMoeda,
  formatarPercentual,
  precoAbaixoDoSugerido,
} from './precificacaoUtils'
import '../../styles/produtos.css'

function resumoDaFicha({ carregando, erro, linhas }) {
  if (carregando) return 'Carregando insumos...'
  if (erro) return 'Insumos indisponíveis'
  return `${linhas.length} ${linhas.length === 1 ? 'insumo' : 'insumos'}`
}

function rotuloDaMargem(lucro) {
  if (lucro === null) return 'Custo indisponível'
  if (lucro > 0) return 'Margem positiva'
  if (lucro < 0) return 'Margem negativa'
  return 'Sem margem'
}

export default function ProdutoCard({ produto, aoEditar, onFichaAlterada }) {
  const { ehDona } = useSessao()
  const [expandido, setExpandido] = useState(false)
  const ficha = useFichaTecnica(produto.idProduto)

  const preco = Number(produto.precoAtual || 0)
  const custoDisponivel = produto.custoEstimado != null
  const lucro = custoDisponivel ? preco - Number(produto.custoEstimado) : null
  const margem = custoDisponivel && preco > 0 ? (lucro / preco) * 100 : 0
  const abaixoDoSugerido = ehDona && precoAbaixoDoSugerido(produto)
  const semFicha = !ficha.carregando && !ficha.erro && ficha.linhas.length === 0
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
            <small>{resumoDaFicha(ficha)}</small>
            {semFicha && <span className="badge-aviso">Sem ficha técnica</span>}
            {abaixoDoSugerido && (
              <span className="badge-aviso alerta">Preço abaixo do sugerido</span>
            )}
          </div>
        </div>
        <div className="product-price">
          <small>Preço</small>
          <b>{formatarMoeda(preco)}</b>
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
        {ehDona && (
          <button
            type="button"
            className="icon-action"
            aria-label={`Editar ${produto.nome}`}
            onClick={aoEditar}
          >
            <Pencil size={17} />
          </button>
        )}
      </div>
      {expandido && (
        <div id={painelId} className="card-details product-details">
          <p className="detail-description">
            {produto.descricao || 'Produto sem descrição cadastrada.'}
          </p>
          <FichaTecnica
            produto={produto}
            ficha={ficha}
            podeEditar={ehDona}
            onFichaAlterada={onFichaAlterada}
          />
          {ehDona && (
            <section
              className={`pricing-panel ${lucro !== null && lucro < 0 ? 'negative' : ''}`}
              aria-label="Precificação estimada"
            >
              <header>
                <span>
                  <DollarSign size={14} /> Precificação estimada
                </span>
                <span className="margin-badge">{rotuloDaMargem(lucro)}</span>
              </header>
              <div className="pricing-grid">
                <div>
                  <small>Custo estimado</small>
                  <span>{formatarMoeda(produto.custoEstimado)}</span>
                </div>
                <div>
                  <small>Preço sugerido</small>
                  <span className="suggested-price">{formatarMoeda(produto.precoSugerido)}</span>
                </div>
                <div>
                  <small>Preço atual</small>
                  <span>{formatarMoeda(preco)}</span>
                </div>
                <div>
                  <small>Lucro estimado</small>
                  <span className="profit-value">
                    {lucro === null ? formatarMoeda(null) : `${lucro > 0 ? '+' : ''}${formatarMoeda(lucro)}`}
                  </span>
                </div>
              </div>
              <p className="margem-origem">
                {produto.margemLucro == null
                  ? 'Margem padrão'
                  : `Margem própria: ${formatarPercentual(produto.margemLucro)}`}
              </p>
              {custoDisponivel ? (
                <div className="margin-progress">
                  <div className="margin-track">
                    <span style={{ width: `${Math.min(100, Math.max(0, margem))}%` }} />
                  </div>
                  <span>{Math.round(margem)}%</span>
                  <TrendingUp size={13} />
                </div>
              ) : (
                <p className="margem-origem">
                  O custo depende da ficha técnica e do preço de compra dos insumos.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </article>
  )
}
