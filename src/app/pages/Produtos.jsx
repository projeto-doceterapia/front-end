import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import api from '../../services/api'
import ProdutoCard from '../../components/produtos/ProdutoCard'

const produtoInicial = {
  nome: '',
  fkCategoriaProduto: '',
  precoAtual: '',
  custoEstimado: 0,
  precoSugerido: 0,
  margemLucro: 0,
  unidadeProducao: 'UNIDADE',
  status: 'ATIVO',
  quantidadeProduzida: 0,
  descricao: '',
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
  const [modal, setModal] = useState(false)
  const [edicao, setEdicao] = useState(null)
  const [form, setForm] = useState(produtoInicial)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const [resProdutos, resCategorias] = await Promise.all([
        api.get('/produtos'),
        api.get('/categorias-produto'),
      ])
      setProdutos(resProdutos.data || [])
      setCategorias(resCategorias.data || [])
    } catch {
      setErro(
        'Não foi possível carregar os produtos. Verifique a conexão com o servidor.'
      )
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const visiveis = useMemo(
    () =>
      produtos.filter((produto) => {
        const texto = `${produto.nome} ${produto.categoriaNome || ''}`.toLowerCase()
        return (
          texto.includes(busca.toLowerCase()) &&
          (categoriaAtiva === 'todas' || String(produto.categoriaId) === categoriaAtiva)
        )
      }),
    [produtos, busca, categoriaAtiva]
  )

  function abrir(produto = null) {
    setEdicao(produto)
    setForm(
      produto
        ? {
            ...produto,
            fkCategoriaProduto: produto.categoriaId,
            precoAtual: produto.precoAtual ?? '',
            custoEstimado: produto.custoEstimado ?? 0,
            precoSugerido: produto.precoSugerido ?? 0,
            margemLucro: produto.margemLucro ?? 0,
            unidadeProducao: produto.unidadeProducao || 'UNIDADE',
            status: produto.status || 'ATIVO',
            quantidadeProduzida: produto.quantidadeProduzida ?? 0,
            descricao: produto.descricao || '',
          }
        : produtoInicial
    )
    setErro('')
    setModal(true)
  }

  async function salvar(event) {
    event.preventDefault()

    const payload = {
      ...form,
      fkCategoriaProduto: Number(form.fkCategoriaProduto),
      precoAtual: Number(form.precoAtual),
      custoEstimado: Number(form.custoEstimado),
      precoSugerido: Number(form.precoSugerido),
      margemLucro: Number(form.margemLucro),
      quantidadeProduzida: Number(form.quantidadeProduzida),
    }

    try {
      if (edicao) {
        await api.put(`/produtos/${edicao.idProduto}`, payload)
      } else {
        await api.post('/produtos', payload)
      }

      setModal(false)
      carregar()
    } catch {
      setErro('Não foi possível salvar. Confira os campos obrigatórios.')
    }
  }

  return (
    <main className="catalog-page">
      <PageTop
        titulo="Produtos"
        subtitulo="Gerencie o catálogo de produtos da confeitaria"
        acao="Novo Produto"
        aoClicar={() => abrir()}
      />
      {erro && !modal && <p className="catalog-error">{erro}</p>}
      <section className="catalog-body">
        <div className="filter-chips">
          <button
            className={categoriaAtiva === 'todas' ? 'selected' : ''}
            onClick={() => setCategoriaAtiva('todas')}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              className={
                categoriaAtiva === String(c.idCategoriaProduto) ? 'selected' : ''
              }
              onClick={() => setCategoriaAtiva(String(c.idCategoriaProduto))}
              key={c.idCategoriaProduto}
            >
              {c.nome}
            </button>
          ))}
          <button className="add-chip">
            <Plus size={13} /> Categoria
          </button>
        </div>
        <label className="catalog-search">
          <Search size={18} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
          />
        </label>
        <div className="catalog-list">
          {visiveis.map((produto) => (
            <ProdutoCard
              key={produto.idProduto}
              produto={produto}
              aoEditar={() => abrir(produto)}
            />
          ))}
        </div>
        {!erro && visiveis.length === 0 && (
          <p className="empty-catalog">Nenhum produto encontrado.</p>
        )}
      </section>
      {modal && (
        <Modal
          titulo={edicao ? 'Editar produto' : 'Novo produto'}
          aoFechar={() => setModal(false)}
        >
          <form className="catalog-form" onSubmit={salvar}>
            <label>
              Nome
              <input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </label>
            <label>
              Categoria
              <select
                required
                value={form.fkCategoriaProduto}
                onChange={(e) => setForm({ ...form, fkCategoriaProduto: e.target.value })}
              >
                <option value="">Selecione</option>
                {categorias.map((c) => (
                  <option value={c.idCategoriaProduto} key={c.idCategoriaProduto}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preço atual
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.precoAtual}
                onChange={(e) => setForm({ ...form, precoAtual: e.target.value })}
              />
            </label>
            <label>
              Descrição
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </label>
            {erro && <p className="catalog-error">{erro}</p>}
            <button className="primary-button">Salvar produto</button>
          </form>
        </Modal>
      )}
    </main>
  )
}

export function PageTop({ titulo, subtitulo, acao, aoClicar }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </div>
        <button className="primary-button" onClick={aoClicar}>
          <Plus size={18} /> {acao}
        </button>
      </div>
    </>
  )
}
export function Modal({ titulo, children, aoFechar }) {
  return (
    <div className="catalog-overlay">
      <section className="catalog-modal">
        <header>
          <h2>{titulo}</h2>
          <button onClick={aoFechar} aria-label="Fechar">
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
