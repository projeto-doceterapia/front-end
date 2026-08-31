import { Edit3, Package, Plus, Search } from 'lucide-react'
import { produtos } from './dadosPedido.jsx'

const categorias = ['Todas', 'Bolo', 'Pote', 'Gelado', 'Cupcake', 'Pão de Mel', 'Docinho']

export default function CatalogoProdutos({ aoAdicionar, dinheiro }) {
  return (
    <section className="product-catalog order-panel">
      <header>
        <span className="panel-icon"><Package size={17} /></span>
        <h2>Catálogo de produtos</h2>
      </header>

      <div className="catalog-body">
        <label className="search">
          <Search size={15} />
          <input placeholder="Buscar produto..." />
        </label>

        <div className="categories">
          {categorias.map((categoria, indice) => (
            <button className={indice === 0 ? 'selected' : ''} key={categoria}>{categoria}</button>
          ))}
        </div>

        <div className="products-grid">
          {produtos.map((produto) => (
            <Produto produto={produto} aoAdicionar={aoAdicionar} dinheiro={dinheiro} key={produto[0]} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Produto({ produto, aoAdicionar, dinheiro }) {
  return (
    <article className="product">
      <Edit3 size={16} />
      <strong>{produto[0]}</strong>
      <small>{produto[1]}</small>
      <b>{dinheiro(produto[2])}</b>
      <p>Estoque: 3000 g de Farinha de Trigo</p>
      <button onClick={() => aoAdicionar(produto)}>
        <Plus size={14} />
        Adicionar
      </button>
    </article>
  )
}
