import { useEffect, useMemo, useState } from 'react'
import { Building2, ClipboardList, Search, UsersRound } from 'lucide-react'
import api from '../../services/api'
import { Modal, PageTop } from './Produtos'
import ClienteCard from '../../components/clientes/ClienteCard'

const clienteInicial = {
  nome: '',
  telefone: '',
  endereco: '',
  tipoPessoa: 'FISICA',
  classificacaoCliente: 'PADRAO',
  status: 'ATIVO',
  observacao: '',
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [itens, setItens] = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(false)
  const [edicao, setEdicao] = useState(null)
  const [form, setForm] = useState(clienteInicial)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const [resClientes, resPedidos, resItens, resProdutos] = await Promise.all([
        api.get('/clientes'),
        api.get('/pedidos'),
        api.get('/itens-pedido'),
        api.get('/produtos'),
      ])

      setClientes(resClientes.data || [])
      setPedidos(resPedidos.data || [])
      setItens(resItens.data || [])
      setProdutos(resProdutos.data || [])
    } catch {
      setErro(
        'Não foi possível carregar os clientes. Verifique a conexão com o servidor.'
      )
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const pedidosCliente = (id) => pedidos.filter((pedido) => pedido.clienteId === id)

  const visiveis = useMemo(
    () =>
      clientes.filter((cliente) => {
        const texto =
          `${cliente.nome} ${cliente.telefone} ${cliente.endereco}`.toLowerCase()
        const correspondeBusca = texto.includes(busca.toLowerCase())
        const correspondeFiltro =
          filtro === 'todos' ||
          (filtro === 'empresa' && cliente.tipoPessoa === 'JURIDICA') ||
          (filtro === 'frequente' && cliente.classificacaoCliente === 'FREQUENTE') ||
          (filtro === 'volume' && cliente.classificacaoCliente === 'ALTO_VOLUME')

        return correspondeBusca && correspondeFiltro
      }),
    [clientes, busca, filtro]
  )

  function abrir(cliente = null) {
    setEdicao(cliente)
    setForm(cliente ? { ...cliente } : clienteInicial)
    setErro('')
    setModal(true)
  }

  async function salvar(evento) {
    evento.preventDefault()

    try {
      if (edicao) {
        await api.put(`/clientes/${edicao.idCliente}`, form)
      } else {
        await api.post('/clientes', form)
      }

      setModal(false)
      carregar()
    } catch {
      setErro('Não foi possível salvar. Confira os campos obrigatórios.')
    }
  }

  const altoVolume = clientes.filter(
    (cliente) => cliente.classificacaoCliente === 'ALTO_VOLUME'
  ).length

  return (
    <main className="catalog-page clients-page">
      <PageTop
        titulo="Clientes"
        subtitulo="Gerencie os clientes e acompanhe seu histórico de pedidos"
        acao="Novo Cliente"
        aoClicar={() => abrir()}
      />
      <section className="catalog-body">
        <div className="client-stats">
          <Stat icon={<UsersRound />} titulo="Total" valor={clientes.length} />
          <Stat icon={<Building2 />} titulo="Alto volume" valor={altoVolume} amarelo />
          <Stat icon={<ClipboardList />} titulo="Pedidos totais" valor={pedidos.length} />
        </div>
        {erro && !modal && <p className="catalog-error">{erro}</p>}
        <div className="client-filters">
          <label className="catalog-search">
            <Search size={18} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, telefone ou endereço..."
            />
          </label>
          <div className="filter-chips">
            <button
              className={filtro === 'todos' ? 'selected' : ''}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </button>
            <button
              className={filtro === 'empresa' ? 'selected' : ''}
              onClick={() => setFiltro('empresa')}
            >
              Empresa
            </button>
            <button
              className={filtro === 'frequente' ? 'selected' : ''}
              onClick={() => setFiltro('frequente')}
            >
              Cliente frequente
            </button>
            <button
              className={filtro === 'volume' ? 'selected' : ''}
              onClick={() => setFiltro('volume')}
            >
              Alto volume
            </button>
          </div>
        </div>
        <div className="clients-list">
          {visiveis.map((cliente) => (
            <ClienteCard
              key={cliente.idCliente}
              cliente={cliente}
              pedidos={pedidosCliente(cliente.idCliente)}
              itens={itens}
              produtos={produtos}
              aoEditar={() => abrir(cliente)}
            />
          ))}
        </div>
        {!erro && visiveis.length === 0 && (
          <p className="empty-catalog">Nenhum cliente encontrado.</p>
        )}
      </section>
      {modal && (
        <Modal
          titulo={edicao ? 'Editar cliente' : 'Novo cliente'}
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
              Telefone
              <input
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </label>
            <label>
              Endereço
              <input
                required
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.tipoPessoa}
                onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}
              >
                <option value="FISICA">Pessoa física</option>
                <option value="JURIDICA">Empresa</option>
              </select>
            </label>
            <label>
              Classificação
              <select
                value={form.classificacaoCliente}
                onChange={(e) =>
                  setForm({ ...form, classificacaoCliente: e.target.value })
                }
              >
                <option value="PADRAO">Padrão</option>
                <option value="FREQUENTE">Cliente frequente</option>
                <option value="ALTO_VOLUME">Alto volume</option>
              </select>
            </label>
            {erro && <p className="catalog-error">{erro}</p>}
            <button className="primary-button">Salvar cliente</button>
          </form>
        </Modal>
      )}
    </main>
  )
}
function Stat({ icon, titulo, valor, amarelo }) {
  return (
    <article className={`client-stat ${amarelo ? 'yellow' : ''}`}>
      <span>{icon}</span>
      <small>{titulo}</small>
      <b>{valor}</b>
    </article>
  )
}
