import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChefHat, PackageCheck, Truck } from 'lucide-react'
import { PageTop } from './Produtos'
import PedidoProducaoCard from '../../components/pedidos/PedidoProducaoCard'
import PaginacaoPedidos from '../../components/pedidos/PaginacaoPedidos'
import PainelPedido from '../../components/pedidos/PainelPedido'
import ResumoPedidos from '../../components/pedidos/ResumoPedidos'
import FiltroPeriodoPedidos from '../../components/pedidos/FiltroPeriodoPedidos'
import useRecortePedidos from '../../components/pedidos/useRecortePedidos'
import api from '../../services/api'
import { dataPedido, pagamentoDoPedido, STATUS_PEDIDO, substituirPedido } from '../../components/pedidos/pedidoUtils'
import { dataISO, filtroAberturaProducao, formatarDataCompleta, STATUS_PRODUCAO } from '../../components/pedidos/filtrosUtils'

const ITENS_POR_PAGINA = 6
const FILTROS = [
  ['todos', 'Todos'],
  ['hoje', 'Hoje'],
  ['amanha', 'Amanhã'],
  ['proximos', 'Próximos 3 dias'],
  ['semana', 'Esta semana'],
  ['EM_PRODUCAO', 'Em produção'],
  ['AGUARDANDO_ENTREGA', 'Prontos p/ entrega'],
]
const OPCOES_STATUS = STATUS_PRODUCAO.map((status) => [status, STATUS_PEDIDO[status]])

export default function Producao({ onNewOrder }) {
  const recorte = useRecortePedidos(filtroAberturaProducao)
  const { pedidos, setPedidos, itens, pagamentos, carregando, erro } = recorte
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    // The edit dialog still offers the client list; the cards use nomeCliente from the order.
    Promise.all([api.get('/clientes'), api.get('/produtos')])
      .then(([respostaClientes, respostaProdutos]) => {
        setClientes(respostaClientes.data || [])
        setProdutos(respostaProdutos.data || [])
      })
      .catch((falha) => console.error(falha))
  }, [])

  const hoje = dataISO(new Date())
  const amanhaDate = new Date()
  amanhaDate.setDate(amanhaDate.getDate() + 1)
  const amanha = dataISO(amanhaDate)
  const proximoLimite = new Date()
  proximoLimite.setDate(proximoLimite.getDate() + 3)
  const limiteTresDias = dataISO(proximoLimite)
  const primeiroDiaSemana = new Date()
  primeiroDiaSemana.setDate(primeiroDiaSemana.getDate() - (primeiroDiaSemana.getDay() + 6) % 7)
  const ultimoDiaSemana = new Date(primeiroDiaSemana)
  ultimoDiaSemana.setDate(ultimoDiaSemana.getDate() + 6)
  const inicioSemanaISO = dataISO(primeiroDiaSemana)
  const fimSemanaISO = dataISO(ultimoDiaSemana)

  // An order advanced past the loaded stages (e.g. delivered) leaves the queue without a reload.
  const emAndamento = pedidos.filter((pedido) => recorte.filtro.status.includes(pedido.statusPedido))
  const visiveis = useMemo(() => emAndamento.filter((pedido) => {
    const data = dataPedido(pedido)
    if (filtro === 'hoje') return data === hoje
    if (filtro === 'amanha') return data === amanha
    if (filtro === 'proximos') return data >= hoje && data <= limiteTresDias
    if (filtro === 'semana') return data >= inicioSemanaISO && data <= fimSemanaISO
    if (['EM_PRODUCAO', 'AGUARDANDO_ENTREGA'].includes(filtro)) return pedido.statusPedido === filtro
    return true
  }).sort((a, b) => dataPedido(a).localeCompare(dataPedido(b)) || Number(a.idPedido) - Number(b.idPedido)), [emAndamento, filtro, hoje, amanha, limiteTresDias, inicioSemanaISO, fimSemanaISO])

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / ITENS_POR_PAGINA))
  const pedidosPagina = visiveis.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)
  const totalHoje = pedidos.filter((pedido) => dataPedido(pedido) === hoje && pedido.statusPedido !== 'CANCELADO').length
  const resumo = [
    { titulo: 'Em produção agora', valor: pedidos.filter((pedido) => pedido.statusPedido === 'EM_PRODUCAO').length, icone: ChefHat, cor: 'summary-blue' },
    { titulo: 'Prontos para entrega', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_ENTREGA').length, icone: PackageCheck, cor: 'summary-purple' },
    { titulo: 'Aguardando sinal', valor: pedidos.filter((pedido) => pedido.statusPedido === 'AGUARDANDO_SINAL').length, icone: AlertCircle, cor: 'summary-amber' },
    { titulo: 'Entregas hoje', valor: totalHoje, icone: Truck, cor: 'summary-rose' },
  ]

  const pedidoAberto = aberto && pedidos.find((pedido) => Number(pedido.idPedido) === Number(aberto.id))

  function atualizarNaLista(atualizado) {
    setPedidos((atuais) => substituirPedido(atuais, atualizado))
  }

  function mudarFiltro(novoFiltro) {
    setFiltro(novoFiltro)
    setPagina(1)
  }

  function carregarRecorte(novoFiltro) {
    setPagina(1)
    recorte.carregar(novoFiltro)
  }

  const periodo = `${formatarDataCompleta(recorte.filtro.de)} e ${formatarDataCompleta(recorte.filtro.ate)}`

  return (
    <main className="orders-page production-page">
      <PageTop titulo="Produção" subtitulo="Acompanhe o que precisa ser produzido — pedidos confirmados em andamento" acao="Novo Pedido" aoClicar={onNewOrder} />
      <ResumoPedidos itens={resumo} />
      <FiltroPeriodoPedidos
        filtro={recorte.filtro}
        opcoesStatus={OPCOES_STATUS}
        exigeStatus
        carregando={carregando}
        onAplicar={carregarRecorte}
        onRestaurar={() => carregarRecorte(filtroAberturaProducao())}
      />
      <section className="production-filters" aria-label="Filtrar pedidos de produção">
        {FILTROS.map(([valor, texto]) => (
          <button type="button" key={valor} className={filtro === valor ? 'selected' : ''} onClick={() => mudarFiltro(valor)}>{texto}</button>
        ))}
      </section>
      {erro && <p className="orders-error" role="alert">{erro}</p>}
      {carregando && <p className="orders-empty orders-loading" role="status">Carregando pedidos...</p>}
      <section className="production-list" aria-label="Fila de produção" aria-busy={carregando}>
        {!carregando && pedidosPagina.map((pedido) => (
          <PedidoProducaoCard
            key={pedido.idPedido}
            pedido={pedido}
            clientes={clientes}
            itens={itens}
            produtos={produtos}
            pagamento={pagamentoDoPedido(pedido, pagamentos)}
            onAbrir={() => setAberto({ id: pedido.idPedido, modo: 'detalhe' })}
            onPedidoAtualizado={atualizarNaLista}
          />
        ))}
        {!erro && !carregando && emAndamento.length === 0 && <p className="orders-empty">Nenhum pedido com entrega entre {periodo}.</p>}
        {!erro && !carregando && emAndamento.length > 0 && visiveis.length === 0 && <p className="orders-empty">Nenhum pedido corresponde a este filtro.</p>}
      </section>
      {!carregando && visiveis.length > 0 && <PaginacaoPedidos totalItens={visiveis.length} porPagina={ITENS_POR_PAGINA} pagina={Math.min(pagina, totalPaginas)} aoMudar={setPagina} />}
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
