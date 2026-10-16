import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, Package, Pencil, Plus, Search, Trash2, TrendingDown, TriangleAlert } from 'lucide-react'
import api from '../../services/api'
import ModalEstoque from '../../components/estoque/ModalEstoque'
import { mensagemErro, nivelEstoque, numeroDecimal, unidades } from '../../components/estoque/estoqueUtils'
import '../../styles/estoque.css'

const niveis = {
  normal: { nome: 'Normal', titulo: 'Em nível normal', Icone: CircleCheck },
  baixo: { nome: 'Baixo', titulo: 'Nível baixo', Icone: TriangleAlert },
  critico: { nome: 'Crítico', titulo: 'Crítico', Icone: TrendingDown },
}
const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Estoque() {
  const [insumos, setInsumos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState('todos')
  const [categoria, setCategoria] = useState('')
  const [ordem, setOrdem] = useState('critico')
  const [modal, setModal] = useState(null)
  const [edicao, setEdicao] = useState(null)
  const [form, setForm] = useState({})
  const [erroModal, setErroModal] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const [itens, grupos] = await Promise.all([api.get('/insumos'), api.get('/categorias-insumo')])
      setInsumos(itens.data || [])
      setCategorias(grupos.data || [])
    } catch (error) {
      setErro(mensagemErro(error, 'Não foi possível carregar o estoque. Verifique a conexão com o servidor.'))
    } finally { setCarregando(false) }
  }

  useEffect(() => {
    let ativo = true
    Promise.all([api.get('/insumos'), api.get('/categorias-insumo')])
      .then(([itens, grupos]) => {
        if (!ativo) return
        setInsumos(itens.data || [])
        setCategorias(grupos.data || [])
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error, 'Não foi possível carregar o estoque. Verifique a conexão com o servidor.'))
      })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const contagens = useMemo(() => insumos.reduce((total, item) => {
    total[nivelEstoque(item).status] += 1
    return total
  }, { normal: 0, baixo: 0, critico: 0 }), [insumos])

  const visiveis = useMemo(() => insumos.filter((item) => (
    normalizar(item.nome).includes(normalizar(busca.trim())) &&
    (!categoria || String(item.categoriaId) === categoria) &&
    (nivel === 'todos' || nivelEstoque(item).status === nivel)
  )).sort((a, b) => {
    if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')
    const prioridade = { critico: 0, baixo: 1, normal: 2 }
    return ordem === 'maior'
      ? nivelEstoque(b).proporcao - nivelEstoque(a).proporcao
      : prioridade[nivelEstoque(a).status] - prioridade[nivelEstoque(b).status]
  }), [insumos, busca, categoria, nivel, ordem])

  function abrir(item = null) {
    setEdicao(item)
    setForm(item ? {
      nome: item.nome, quantidadeAtual: String(item.quantidadeAtual).replace('.', ','),
      quantidadeMinima: String(item.quantidadeMinima).replace('.', ','), unidade: item.unidade,
      fkCategoriaInsumo: String(item.categoriaId),
    } : { nome: '', quantidadeAtual: '', quantidadeMinima: '', unidade: 'KG', fkCategoriaInsumo: String(categorias[0]?.idCategoriaInsumo || '') })
    setErroModal('')
    setExcluindo(false)
    setModal('insumo')
  }

  function alterar(event) { setForm({ ...form, [event.target.name]: event.target.value }) }
  function fechar() { if (!ocupado) setModal(null) }

  async function salvar(event) {
    event.preventDefault()
    if (ocupado) return
    const quantidadeAtual = numeroDecimal(form.quantidadeAtual)
    const quantidadeMinima = numeroDecimal(form.quantidadeMinima)
    if (!form.nome.trim() || !form.fkCategoriaInsumo || !Number.isFinite(quantidadeAtual) || !Number.isFinite(quantidadeMinima) || quantidadeAtual < 0 || quantidadeMinima < 0) {
      setErroModal('Preencha o nome, a categoria e quantidades válidas, maiores ou iguais a zero.')
      return
    }
    setOcupado(true)
    setErroModal('')
    const payload = {
      nome: form.nome.trim(), quantidadeAtual, quantidadeMinima, unidade: form.unidade,
      fkCategoriaInsumo: Number(form.fkCategoriaInsumo), status: edicao?.status || 'ATIVO',
      marca: edicao?.marca ?? null, custoUnitario: edicao?.custoUnitario ?? null,
    }
    try {
      const resposta = edicao ? await api.put(`/insumos/${edicao.idInsumo}`, payload) : await api.post('/insumos', payload)
      setInsumos((atuais) => edicao ? atuais.map((item) => item.idInsumo === edicao.idInsumo ? resposta.data : item) : [...atuais, resposta.data])
      setModal(null)
    } catch (error) { setErroModal(mensagemErro(error, 'Não foi possível salvar o insumo. Confira os dados e tente novamente.')) }
    finally { setOcupado(false) }
  }

  async function excluir() {
    if (ocupado) return
    setOcupado(true)
    setErroModal('')
    try {
      await api.delete(`/insumos/${edicao.idInsumo}`)
      setInsumos((atuais) => atuais.filter((item) => item.idInsumo !== edicao.idInsumo))
      setModal(null)
    } catch (error) { setErroModal(mensagemErro(error, 'Não foi possível excluir o insumo. Ele pode estar vinculado a um produto.')) }
    finally { setOcupado(false) }
  }

  async function salvarCategoria(event) {
    event.preventDefault()
    if (!form.nome.trim() || ocupado) return
    setOcupado(true)
    setErroModal('')
    try {
      const { data } = await api.post('/categorias-insumo', { nome: form.nome.trim() })
      setCategorias((atuais) => [...atuais, data])
      setModal(null)
    } catch (error) { setErroModal(mensagemErro(error, 'Não foi possível adicionar a categoria. Verifique se ela já existe.')) }
    finally { setOcupado(false) }
  }

  return (
    <main className="stock-page">
      <header className="stock-heading">
        <div><h1>Estoque</h1><p>Controle seus insumos e acompanhe alertas de baixo nível</p></div>
        <button className="stock-primary" onClick={() => abrir()} disabled={carregando || Boolean(erro)}><Plus size={14} /> Novo Insumo</button>
      </header>
      <section className="stock-summaries" aria-label="Resumo do estoque">
        {[{ id: 'total', titulo: 'Total de insumos', Icone: Package, valor: insumos.length }, ...Object.entries(niveis).map(([id, dados]) => ({ id, ...dados, valor: contagens[id] }))].map(({ id, titulo, Icone, valor }) => (
          <article className={`stock-summary stock-${id}`} key={id}><div><span className="stock-summary-icon"><Icone size={13} /></span><span>{titulo}</span></div><strong>{carregando || erro ? '—' : valor}</strong></article>
        ))}
      </section>
      <section className="stock-panel" aria-label="Insumos em estoque">
        <div className="stock-toolbar">
          <label className="stock-search"><Search size={13} /><input aria-label="Buscar insumo" placeholder="Buscar insumo..." value={busca} onChange={(event) => setBusca(event.target.value)} /></label>
          <div className="stock-level-filters" aria-label="Filtrar por nível">
            {[['todos', 'Todos'], ...Object.entries(niveis).map(([id, dados]) => [id, dados.nome])].map(([id, nome]) => <button key={id} aria-pressed={nivel === id} className={nivel === id ? 'selected' : ''} onClick={() => setNivel(id)}>{nome}</button>)}
          </div>
          <select aria-label="Filtrar por categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)}><option value="">Categoria</option>{categorias.map((item) => <option key={item.idCategoriaInsumo} value={item.idCategoriaInsumo}>{item.nome}</option>)}</select>
          <select aria-label="Ordenar insumos" value={ordem} onChange={(event) => setOrdem(event.target.value)}><option value="critico">Mais crítico</option><option value="maior">Maior nível</option><option value="nome">Nome A–Z</option></select>
        </div>
        <div className="stock-categories"><span>Categorias:</span>{categorias.map((item) => <button key={item.idCategoriaInsumo} aria-pressed={categoria === String(item.idCategoriaInsumo)} className={categoria === String(item.idCategoriaInsumo) ? 'selected' : ''} onClick={() => setCategoria(categoria === String(item.idCategoriaInsumo) ? '' : String(item.idCategoriaInsumo))}>{item.nome}</button>)}<button className="stock-add-category" disabled={carregando || Boolean(erro)} onClick={() => { setForm({ nome: '' }); setErroModal(''); setModal('categoria') }}><Plus size={10} /> Nova</button></div>
        <div className="stock-table-scroll"><table className="stock-table">
          <thead><tr><th>Insumo</th><th>Categoria</th><th>Quantidade</th><th>Mínimo</th><th>Nível</th><th>Status</th><th><span className="stock-sr-only">Ações</span></th></tr></thead>
          <tbody>{!carregando && !erro && visiveis.map((item) => {
            const { status, percentual } = nivelEstoque(item)
            const { nome, Icone } = niveis[status]
            return <tr key={item.idInsumo} className={`stock-${status}`}>
              <td><div className="stock-item-name"><span className="stock-item-icon"><Package size={12} /></span>{item.nome}</div></td>
              <td><span className="stock-category-badge">{item.categoriaNome}</span></td>
              <td>{Number(item.quantidadeAtual)} {unidades[item.unidade]}</td>
              <td className="stock-muted">{Number(item.quantidadeMinima)} {unidades[item.unidade]}</td>
              <td><div className="stock-level"><div className="stock-progress" role="progressbar" aria-label={`Nível de ${item.nome}`} aria-valuenow={percentual} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentual}%` }} /></div><span>{percentual}%</span></div></td>
              <td><span className="stock-status"><Icone size={10} />{nome}</span></td>
              <td><button className="stock-icon-button" aria-label={`Editar ${item.nome}`} onClick={() => abrir(item)}><Pencil size={12} /></button></td>
            </tr>
          })}</tbody>
        </table></div>
        {carregando && <p className="stock-empty" role="status">Carregando estoque...</p>}
        {erro && <div className="stock-empty" role="alert"><p>{erro}</p><button className="stock-secondary" onClick={carregar}>Tentar novamente</button></div>}
        {!carregando && !erro && !visiveis.length && <p className="stock-empty">{insumos.length ? 'Nenhum insumo encontrado para os filtros selecionados.' : 'Nenhum insumo cadastrado. Adicione seu primeiro insumo.'}</p>}
      </section>
      {modal && <ModalEstoque titulo={modal === 'categoria' ? 'Nova Categoria' : edicao ? 'Editar Insumo' : 'Novo Insumo'} aoFechar={fechar} ocupado={ocupado}>
        <form className="stock-form" onSubmit={modal === 'categoria' ? salvarCategoria : salvar}>
          <fieldset disabled={ocupado}>
            <label className="stock-full">{modal === 'categoria' ? 'Nome da categoria' : 'Nome do insumo'}<input autoFocus required maxLength={45} name="nome" value={form.nome} onChange={alterar} placeholder={modal === 'categoria' ? 'Ex: Base' : 'Ex: Farinha de Trigo'} /></label>
            {modal === 'insumo' && <>
              <label>Quantidade atual<input required inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" name="quantidadeAtual" value={form.quantidadeAtual} onChange={alterar} /></label>
              <label>Unidade<select name="unidade" value={form.unidade} onChange={alterar}>{Object.entries(unidades).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}</select></label>
              <label>Qtd. mínima<input required inputMode="decimal" pattern="[0-9]+([.,][0-9]+)?" name="quantidadeMinima" value={form.quantidadeMinima} onChange={alterar} /></label>
              <label>Categoria<select required name="fkCategoriaInsumo" value={form.fkCategoriaInsumo} onChange={alterar}>{!categorias.length && <option value="">Cadastre uma categoria</option>}{categorias.map((item) => <option key={item.idCategoriaInsumo} value={item.idCategoriaInsumo}>{item.nome}</option>)}</select></label>
            </>}
          </fieldset>
          {erroModal && <p className="stock-error" role="alert">{erroModal}</p>}
          {excluindo && <div className="stock-delete-confirm" role="alert"><p>Excluir “{edicao.nome}” do estoque?</p><button type="button" disabled={ocupado} onClick={() => setExcluindo(false)}>Voltar</button><button type="button" disabled={ocupado} onClick={excluir}>{ocupado ? 'Excluindo...' : 'Confirmar exclusão'}</button></div>}
          <footer className="stock-form-actions">
            {modal === 'insumo' && edicao && <button type="button" className="stock-secondary stock-delete" disabled={ocupado} aria-label="Excluir insumo" onClick={() => setExcluindo(true)}><Trash2 size={13} /></button>}
            <button type="button" className="stock-secondary" disabled={ocupado} onClick={fechar}>Cancelar</button>
            <button type="submit" className={`stock-primary ${edicao && modal === 'insumo' ? 'stock-save' : ''}`} disabled={ocupado || (modal === 'insumo' && !categorias.length)}>{ocupado ? 'Aguarde...' : modal === 'insumo' && edicao ? 'Salvar' : 'Adicionar'}</button>
          </footer>
        </form>
      </ModalEstoque>}
    </main>
  )
}
