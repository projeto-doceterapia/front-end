import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import ProdutoCard from '../../components/produtos/ProdutoCard'
import useSessao from '../../components/sessao/useSessao'
import useToast from '../../components/feedback/useToast'
import { numeroDecimal } from '../../components/estoque/estoqueUtils'
import {
  margemParaEnvio,
  mensagemErroProduto,
} from '../../components/produtos/precificacaoUtils'
import {
  listarCategorias,
  listarProdutos,
  salvarProduto,
} from '../../services/produtos'
import '../../styles/produtos.css'

const produtoInicial = {
  nome: '',
  fkCategoriaProduto: '',
  precoAtual: '',
  margemLucro: '',
  unidadeProducao: 'UNIDADE',
  status: 'ATIVO',
  quantidadeProduzida: 0,
  descricao: '',
}

const ERRO_CARGA = 'Não foi possível carregar os produtos. Verifique a conexão com o servidor.'

function formularioDe(produto) {
  return {
    nome: produto.nome,
    fkCategoriaProduto: produto.categoriaId,
    precoAtual: produto.precoAtual ?? '',
    margemLucro: produto.margemLucro == null ? '' : String(produto.margemLucro).replace('.', ','),
    unidadeProducao: produto.unidadeProducao || 'UNIDADE',
    status: produto.status || 'ATIVO',
    quantidadeProduzida: produto.quantidadeProduzida ?? 0,
    descricao: produto.descricao || '',
  }
}

export default function Produtos() {
  const { ehDona } = useSessao()
  const toast = useToast()
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
  const [modal, setModal] = useState(false)
  const [edicao, setEdicao] = useState(null)
  const [form, setForm] = useState(produtoInicial)
  const [erro, setErro] = useState('')
  const [erroMargem, setErroMargem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const origemDoModal = useRef(null)

  async function carregar() {
    try {
      const [dadosProdutos, dadosCategorias] = await Promise.all([
        listarProdutos(),
        listarCategorias(),
      ])
      setProdutos(dadosProdutos)
      setCategorias(dadosCategorias)
      setErro('')
    } catch {
      setErro(ERRO_CARGA)
    } finally {
      setCarregando(false)
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
    origemDoModal.current = document.activeElement
    setEdicao(produto)
    setForm(produto ? formularioDe(produto) : produtoInicial)
    setErroMargem('')
    setModal(true)
  }

  function fechar() {
    setModal(false)
    if (origemDoModal.current?.isConnected) origemDoModal.current.focus()
  }

  async function salvar(event) {
    event.preventDefault()
    if (salvando) return

    const margemLucro = margemParaEnvio(form.margemLucro)
    if (margemLucro !== null && (!Number.isFinite(margemLucro) || margemLucro < 0)) {
      setErroMargem('Informe uma margem maior ou igual a zero.')
      return
    }
    setErroMargem('')

    const payload = {
      nome: form.nome,
      fkCategoriaProduto: Number(form.fkCategoriaProduto),
      precoAtual: numeroDecimal(form.precoAtual),
      margemLucro,
      unidadeProducao: form.unidadeProducao,
      status: form.status,
      quantidadeProduzida: Number(form.quantidadeProduzida),
      descricao: form.descricao,
    }

    setSalvando(true)
    try {
      await salvarProduto(edicao?.idProduto, payload)
      toast.sucesso('Produto salvo.')
      fechar()
      await carregar()
    } catch (falha) {
      toast.erro(mensagemErroProduto(falha, 'Não foi possível salvar. Confira os campos obrigatórios.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="catalog-page">
      <PageTop
        titulo="Produtos"
        subtitulo="Gerencie o catálogo de produtos da confeitaria"
        acao={ehDona ? 'Novo Produto' : undefined}
        aoClicar={() => abrir()}
      />
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
        {carregando && (
          <p className="empty-catalog" role="status">Carregando produtos...</p>
        )}
        {erro && !carregando && (
          <p className="catalog-error" role="alert">{erro}</p>
        )}
        <div className="catalog-list">
          {visiveis.map((produto) => (
            <ProdutoCard
              key={produto.idProduto}
              produto={produto}
              aoEditar={() => abrir(produto)}
              onFichaAlterada={carregar}
            />
          ))}
        </div>
        {!carregando && !erro && visiveis.length === 0 && (
          <p className="empty-catalog">Nenhum produto encontrado.</p>
        )}
      </section>
      {modal && (
        <Modal
          titulo={edicao ? 'Editar produto' : 'Novo produto'}
          aoFechar={fechar}
        >
          <form className="catalog-form" onSubmit={salvar}>
            <label>
              Nome
              <input
                required
                autoFocus
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
            <div className="campo">
              <label htmlFor="produto-margem-propria">Margem própria (%)</label>
              <input
                id="produto-margem-propria"
                inputMode="decimal"
                value={form.margemLucro}
                aria-describedby={`ajuda-margem-propria${erroMargem ? ' erro-margem-propria' : ''}`}
                aria-invalid={erroMargem ? 'true' : undefined}
                onChange={(e) => setForm({ ...form, margemLucro: e.target.value })}
              />
              <small id="ajuda-margem-propria">
                Opcional. Percentual somado ao custo. Ex.: custo R$ 10,00 com 40% → sugerido R$ 14,00.
                Vazio usa a margem padrão.
              </small>
              {erroMargem && (
                <small id="erro-margem-propria" className="campo-erro">{erroMargem}</small>
              )}
            </div>
            <label>
              Descrição
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </label>
            <button className="primary-button" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar produto'}
            </button>
          </form>
        </Modal>
      )}
    </main>
  )
}

export function PageTop({ titulo, subtitulo, acao, aoClicar, children }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </div>
        {(acao || children) && (
          <div className="catalog-actions">
            {children}
            {acao && (
              <button className="primary-button" onClick={aoClicar}>
                <Plus size={18} /> {acao}
              </button>
            )}
          </div>
        )}
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
