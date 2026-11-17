import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Clock3, PackageCheck, Search, ShoppingBag } from 'lucide-react'
import { PageTop } from './Produtos'
import PaginacaoPedidos from '../../components/pedidos/PaginacaoPedidos'
import PainelPedido from '../../components/pedidos/PainelPedido'
import ResumoPedidos from '../../components/pedidos/ResumoPedidos'
import TabelaHistoricoPedidos from '../../components/pedidos/TabelaHistoricoPedidos'
import FiltroPeriodoPedidos from '../../components/pedidos/FiltroPeriodoPedidos'
import useRecortePedidos from '../../components/pedidos/useRecortePedidos'
import api from '../../services/api'
import { dataPedido, substituirPedido } from '../../components/pedidos/pedidoUtils'
import { dataISO, filtroAberturaHistorico, formatarDataCompleta } from '../../components/pedidos/filtrosUtils'

const ITENS_POR_PAGINA = 8
const PERIODOS = [['todos', 'Todos'], ['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês']]
const ETAPAS = [
  ['todos', 'Todos'], ['ORCAMENTO', 'Orçamento'], ['AGUARDANDO_SINAL', 'Aguard. sinal 50%'],
  ['ESPERANDO_FAZER', 'Aguard. produção'], ['EM_PRODUCAO', 'Em produção'],
  ['AGUARDANDO_ENTREGA', 'Aguard. entrega'], ['ENTREGUE', 'Entregue'], ['CANCELADO', 'Cancelado'],
]

export default function HistoricoPedidos({ onNewOrder }) {
  const recorte = useRecortePedidos(filtroAberturaHistorico)
  const { pedidos, setPedidos, itens, pagamentos, carregando, erro } = recorte
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [periodo, setPeriodo] = useState('todos')
  const [etapa, setEtapa] = useState('todos')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    // The edit dialog still offers the client list; rows use nomeCliente from the order.
    Promise.all([api.get('/clientes'), api.get('/produtos')])
      .then(([respostaClientes, respostaProdutos]) => {
        setClientes(respostaClientes.data || [])
        setProdutos(respostaProdutos.data || [])
      })
      .catch((falha) => console.error(falha))
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
    { titulo: 'Aguardando produção', valor: pedidos.filter((pedido) => pedido.statusPedido === 'ESPERANDO_FAZER').length, icone: Clock3, cor: 'summary-orange' },
    { titulo: 'Aguardando entrega', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_ENTREGA').length, icone: PackageCheck, cor: 'summary-purple' },
  ]

  const pedidoAberto = aberto && pedidos.find((pedido) => Number(pedido.idPedido) === Number(aberto.id))

  function atualizarNaLista(atualizado) {
    setPedidos((atuais) => substituirPedido(atuais, atualizado))
  }

  function alterarFiltro(setter, valor) {
    setter(valor)
    setPagina(1)
  }

  function carregarRecorte(novoFiltro) {
    setPagina(1)
    recorte.carregar(novoFiltro)
  }

  return (
    <main className="orders-page history-page">
      <PageTop titulo="Histórico de Pedidos" subtitulo="Consulte, filtre e acompanhe pedidos registrados" acao="Novo Pedido" aoClicar={onNewOrder} />
      <ResumoPedidos itens={resumo} />
      <FiltroPeriodoPedidos
        filtro={recorte.filtro}
        carregando={carregando}
        onAplicar={carregarRecorte}
        onRestaurar={() => carregarRecorte(filtroAberturaHistorico())}
      />
      <section className="history-panel" aria-busy={carregando}>
        <div className="history-controls">
          <div className="history-periods"><span>Período:</span>{PERIODOS.map(([valor, texto]) => <button type="button" className={periodo === valor ? 'selected' : ''} key={valor} onClick={() => alterarFiltro(setPeriodo, valor)}>{texto}</button>)}</div>
          <div className="history-stages"><span>Filtrar por etapa</span><div>{ETAPAS.map(([valor, texto]) => <button type="button" className={etapa === valor ? 'selected' : ''} key={valor} onClick={() => alterarFiltro(setEtapa, valor)}>{texto}<b>{valor === 'todos' ? pedidos.length : pedidos.filter((pedido) => pedido.statusPedido === valor).length}</b></button>)}</div></div>
          <label className="history-search"><Search size={17} /><input value={busca} onChange={(evento) => alterarFiltro(setBusca, evento.target.value)} placeholder="Buscar por cliente, código ou produto..." /></label>
        </div>
        {erro && <p className="orders-error" role="alert">{erro}</p>}
        {carregando && <p className="orders-empty orders-loading" role="status">Carregando pedidos...</p>}
        {!carregando && !erro && !pedidos.length && <p className="orders-empty">Nenhum pedido com entrega entre {formatarDataCompleta(recorte.filtro.de)} e {formatarDataCompleta(recorte.filtro.ate)}.</p>}
        {!carregando && !erro && pedidos.length > 0 && (
          <TabelaHistoricoPedidos
            pedidos={pedidosPagina}
            clientes={clientes}
            itens={itens}
            produtos={produtos}
            pagamentos={pagamentos}
            onAbrir={(pedido) => setAberto({ id: pedido.idPedido, modo: 'detalhe' })}
            onEditar={(pedido) => setAberto({ id: pedido.idPedido, modo: 'editar' })}
          />
        )}
        {!carregando && !erro && visiveis.length > 0 && <PaginacaoPedidos totalItens={visiveis.length} porPagina={ITENS_POR_PAGINA} pagina={Math.min(pagina, totalPaginas)} aoMudar={setPagina} />}
      </section>
      {pedidoAberto && (
        <PainelPedido
          pedido={pedidoAberto}
          modoInicial={aberto.modo}
          clientes={clientes}
          itens={itens}
          produtos={produtos}
          pagamentos={pagamentos}
          onFechar={() => setAberto(null)}
          onPedidoAtualizado={atualizarNaLista}
        />
      )}
    </main>
  )
}
