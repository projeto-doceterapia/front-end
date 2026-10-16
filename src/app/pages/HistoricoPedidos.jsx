import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Clock3, PackageCheck, Search, ShoppingBag } from 'lucide-react'
import { PageTop } from './Produtos'
import PaginacaoPedidos from '../../components/pedidos/PaginacaoPedidos'
import ResumoPedidos from '../../components/pedidos/ResumoPedidos'
import TabelaHistoricoPedidos from '../../components/pedidos/TabelaHistoricoPedidos'
import api from '../../services/api'
import { dataPedido } from '../../components/pedidos/pedidoUtils'

const ITENS_POR_PAGINA = 8
const PERIODOS = [['todos', 'Todos'], ['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês']]
const ETAPAS = [
  ['todos', 'Todos'], ['ORCAMENTO', 'Orçamento'], ['AGUARDANDO_SINAL', 'Aguard. sinal 50%'],
  ['EM_PRODUCAO', 'Em produção'], ['AGUARDANDO_PAGAMENTO', 'Aguard. pagamento'],
  ['AGUARDANDO_ENTREGA', 'Aguard. entrega'], ['ENTREGUE', 'Entregue'], ['CANCELADO', 'Cancelado'],
]

function dataISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export default function HistoricoPedidos({ onNewOrder }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [itens, setItens] = useState([])
  const [produtos, setProdutos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [periodo, setPeriodo] = useState('todos')
  const [etapa, setEtapa] = useState('todos')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const respostas = await Promise.all([
          api.get('/pedidos'), api.get('/clientes'), api.get('/itens-pedido'), api.get('/produtos'), api.get('/pagamentos'),
        ])
        setPedidos(respostas[0].data || [])
        setClientes(respostas[1].data || [])
        setItens(respostas[2].data || [])
        setProdutos(respostas[3].data || [])
        setPagamentos(respostas[4].data || [])
      } catch (error) {
        setErro('Não foi possível carregar o histórico de pedidos. Verifique a conexão com o servidor.')
        console.error(error)
      }
    }
    carregar()
  }, [])

  const hoje = new Date()
  const hojeISO = dataISO(hoje)
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(inicioSemana.getDate() - (inicioSemana.getDay() + 6) % 7)
  const inicioSemanaISO = dataISO(inicioSemana)
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const visiveis = useMemo(() => {
    const consulta = busca.trim().toLocaleLowerCase('pt-BR')
    return pedidos.filter((pedido) => {
      const data = dataPedido(pedido)
      const produtoNomes = itens.filter((item) => Number(item.fkPedido) === Number(pedido.idPedido))
        .map((item) => produtos.find((produto) => Number(produto.idProduto) === Number(item.fkProduto))?.nome || '')
        .join(' ')
      const cliente = pedido.nomeCliente || pedido.clienteNome || clientes.find((registro) => Number(registro.idCliente) === Number(pedido.clienteId ?? pedido.fkCliente))?.nome || ''
      const texto = `${pedido.idPedido} ${cliente} ${produtoNomes}`.toLocaleLowerCase('pt-BR')
      const correspondePeriodo = periodo === 'todos' || (periodo === 'hoje' && data === hojeISO) || (periodo === 'semana' && data >= inicioSemanaISO && data <= hojeISO) || (periodo === 'mes' && data >= inicioMes && data <= hojeISO)
      return correspondePeriodo && (etapa === 'todos' || pedido.statusPedido === etapa) && texto.includes(consulta)
    }).sort((a, b) => dataPedido(b).localeCompare(dataPedido(a)) || Number(b.idPedido) - Number(a.idPedido))
  }, [pedidos, clientes, itens, produtos, periodo, etapa, busca, hojeISO, inicioMes, inicioSemanaISO])

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / ITENS_POR_PAGINA))
  const pedidosPagina = visiveis.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)
  const resumo = [
    { titulo: 'Total de pedidos', valor: pedidos.length, icone: ShoppingBag, cor: 'summary-rose' },
    { titulo: 'Aguardando sinal', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_SINAL').length, icone: AlertCircle, cor: 'summary-amber' },
    { titulo: 'Aguard. pagamento', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_PAGAMENTO').length, icone: Clock3, cor: 'summary-orange' },
    { titulo: '100% pago — entrega', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_ENTREGA').length, icone: PackageCheck, cor: 'summary-purple' },
  ]

  function alterarFiltro(setter, valor) {
    setter(valor)
    setPagina(1)
  }

  return (
    <main className="orders-page history-page">
      <PageTop titulo="Histórico de Pedidos" subtitulo="Consulte, filtre e acompanhe pedidos registrados" acao="Novo Pedido" aoClicar={onNewOrder} />
      <ResumoPedidos itens={resumo} />
      <section className="history-panel">
        <div className="history-controls">
          <div className="history-periods"><span>Período:</span>{PERIODOS.map(([valor, texto]) => <button type="button" className={periodo === valor ? 'selected' : ''} key={valor} onClick={() => alterarFiltro(setPeriodo, valor)}>{texto}</button>)}</div>
          <div className="history-stages"><span>Filtrar por etapa</span><div>{ETAPAS.map(([valor, texto]) => <button type="button" className={etapa === valor ? 'selected' : ''} key={valor} onClick={() => alterarFiltro(setEtapa, valor)}>{texto}<b>{valor === 'todos' ? pedidos.length : pedidos.filter((pedido) => pedido.statusPedido === valor).length}</b></button>)}</div></div>
          <label className="history-search"><Search size={17} /><input value={busca} onChange={(evento) => alterarFiltro(setBusca, evento.target.value)} placeholder="Buscar por cliente, código ou produto..." /></label>
        </div>
        {erro && <p className="orders-error" role="alert">{erro}</p>}
        <TabelaHistoricoPedidos pedidos={pedidosPagina} clientes={clientes} itens={itens} produtos={produtos} pagamentos={pagamentos} />
        {visiveis.length > 0 && <PaginacaoPedidos totalItens={visiveis.length} porPagina={ITENS_POR_PAGINA} pagina={Math.min(pagina, totalPaginas)} aoMudar={setPagina} />}
      </section>
    </main>
  )
}