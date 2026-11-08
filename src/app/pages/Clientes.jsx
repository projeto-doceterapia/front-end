import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, ClipboardList, Search, UsersRound } from 'lucide-react'
import api from '../../services/api'
import { Modal, PageTop } from './Produtos'
import ClienteCard from '../../components/clientes/ClienteCard'
import CampoCep from '../../components/endereco/CampoCep'
import { montarEndereco } from '../../components/endereco/enderecoUtils'
import { mensagemErro } from '../../components/estoque/estoqueUtils'
import useToast from '../../components/feedback/useToast'

const ESPERA_BUSCA_MS = 300
const clienteInicial = {
  nome: '',
  telefone: '',
  endereco: '',
  cep: '',
  tipoPessoa: 'FISICA',
  classificacaoCliente: 'PADRAO',
  status: 'ATIVO',
  observacao: '',
}

function formularioDe(cliente) {
  return {
    nome: cliente.nome,
    telefone: cliente.telefone,
    endereco: cliente.endereco,
    cep: cliente.cep ?? '',
    tipoPessoa: cliente.tipoPessoa,
    classificacaoCliente: cliente.classificacaoCliente,
    status: cliente.status ?? 'ATIVO',
    observacao: cliente.observacao ?? '',
  }
}

export default function Clientes() {
  const { sucesso, erro: avisarErro } = useToast()
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(false)
  const [edicao, setEdicao] = useState(null)
  const [form, setForm] = useState(clienteInicial)
  const [ajudaEndereco, setAjudaEndereco] = useState(false)
  const [erro, setErro] = useState('')
  const requisicaoAtual = useRef(0)
  const campoEndereco = useRef(null)

  const carregarClientes = useCallback(async (termo) => {
    const requisicao = ++requisicaoAtual.current
    setCarregando(true)
    setErro('')
    try {
      const resposta = await api.get('/clientes/resumo', {
        params: termo ? { busca: termo } : undefined,
      })
      if (requisicao === requisicaoAtual.current) setClientes(resposta.data || [])
    } catch {
      if (requisicao === requisicaoAtual.current) {
        setErro('Não foi possível carregar os clientes. Verifique a conexão com o servidor.')
      }
    } finally {
      if (requisicao === requisicaoAtual.current) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    api
      .get('/produtos')
      .then((resposta) => setProdutos(resposta.data || []))
      .catch(() => setProdutos([]))
  }, [])

  const termoBusca = busca.trim()
  useEffect(() => {
    if (termoBusca.length === 1) return undefined

    const espera = setTimeout(
      () => carregarClientes(termoBusca),
      termoBusca ? ESPERA_BUSCA_MS : 0
    )
    return () => clearTimeout(espera)
  }, [termoBusca, carregarClientes])

  const visiveis = useMemo(
    () =>
      clientes.filter(
        (cliente) =>
          filtro === 'todos' ||
          (filtro === 'empresa' && cliente.tipoPessoa === 'JURIDICA') ||
          (filtro === 'frequente' && cliente.classificacaoCliente === 'FREQUENTE') ||
          (filtro === 'volume' && cliente.classificacaoCliente === 'ALTO_VOLUME')
      ),
    [clientes, filtro]
  )

  function abrir(cliente = null) {
    setEdicao(cliente)
    setForm(cliente ? formularioDe(cliente) : clienteInicial)
    setAjudaEndereco(false)
    setModal(true)
  }

  function preencherEndereco(endereco) {
    setForm((atual) => ({ ...atual, endereco: montarEndereco(endereco) }))
    setAjudaEndereco(true)
    campoEndereco.current?.focus()
  }

  async function salvar(evento) {
    evento.preventDefault()

    if (form.cep && form.cep.length !== 8) {
      avisarErro('Informe os 8 dígitos do CEP ou deixe o campo vazio.')
      return
    }

    try {
      const corpo = { ...form, cep: form.cep || null }
      if (edicao) {
        await api.put(`/clientes/${edicao.idCliente}`, corpo)
      } else {
        await api.post('/clientes', corpo)
      }
    } catch (falha) {
      avisarErro(mensagemErro(falha, 'Não foi possível salvar o cliente.'))
      return
    }

    sucesso('Cliente salvo.')
    setModal(false)
    carregarClientes(termoBusca.length === 1 ? '' : termoBusca)
  }

  const altoVolume = clientes.filter(
    (cliente) => cliente.classificacaoCliente === 'ALTO_VOLUME'
  ).length
  const pedidosTotais = clientes.reduce((total, cliente) => total + (cliente.totalPedidos ?? 0), 0)

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
          <Stat icon={<ClipboardList />} titulo="Pedidos totais" valor={pedidosTotais} />
        </div>
        {erro && (
          <p className="catalog-error" role="alert">
            {erro}
          </p>
        )}
        <div className="client-filters">
          <label className="catalog-search">
            <Search size={18} />
            <input
              type="search"
              aria-label="Buscar cliente por nome ou telefone"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou telefone..."
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
        {carregando && (
          <p className="empty-catalog" role="status">
            Carregando clientes...
          </p>
        )}
        <div className="clients-list">
          {visiveis.map((cliente) => (
            <ClienteCard
              key={cliente.idCliente}
              cliente={cliente}
              produtos={produtos}
              aoEditar={() => abrir(cliente)}
            />
          ))}
        </div>
        {!carregando && !erro && visiveis.length === 0 && (
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
            <CampoCep
              id="cep-cliente"
              valor={form.cep}
              onChange={(cep) => setForm({ ...form, cep })}
              onEnderecoEncontrado={preencherEndereco}
            />
            <label>
              Endereço
              <input
                ref={campoEndereco}
                required
                maxLength={255}
                value={form.endereco}
                aria-describedby={ajudaEndereco ? 'endereco-cliente-ajuda' : undefined}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              />
              {ajudaEndereco && (
                <small id="endereco-cliente-ajuda">Complete com o número e o complemento.</small>
              )}
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
