import { Edit3, Package, Plus, Search } from 'lucide-react'
import { useState } from 'react'

export default function CatalogoProdutos({ produtos, aoAdicionar, dinheiro }) {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas')
  const categorias = ['Todas', ...new Set(produtos.map((produto) => produto.categoriaNome).filter(Boolean))]
  const produtosFiltrados = produtos.filter((produto) => {
    const correspondeBusca = produto.nome.toLowerCase().includes(busca.toLowerCase())
    const correspondeCategoria = categoriaAtiva === 'Todas' || produto.categoriaNome === categoriaAtiva
    return correspondeBusca && correspondeCategoria
  })

  return (
    <section className="product-catalog order-panel">
      <header><span className="panel-icon"><Package size={17} /></span><h2>Catálogo de produtos</h2></header>
      <div className="catalog-body">
        <label className="search"><Search size={15} /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar produto..." /></label>
        <div className="categories">
          {categorias.map((categoria) => <button className={categoriaAtiva === categoria ? 'selected' : ''} onClick={() => setCategoriaAtiva(categoria)} key={categoria}>{categoria}</button>)}
        </div>
        <div className="products-grid">
          {produtosFiltrados.map((produto) => <Produto produto={produto} aoAdicionar={aoAdicionar} dinheiro={dinheiro} key={produto.idProduto} />)}
        </div>
      </div>
    </section>
  )
}

function Produto({ produto, aoAdicionar, dinheiro }) {
  return (
    <article className="product">
      <Edit3 size={16} />
      <strong>{produto.nome}</strong>
      <small>{produto.categoriaNome || 'Sem categoria'}</small>
      <b>{dinheiro(produto.precoAtual)}</b>
      <p>{produto.descricao || 'Produto cadastrado'}</p>
      <button onClick={() => aoAdicionar(produto)}><Plus size={14} />Adicionar</button>
    </article>
  )
}
