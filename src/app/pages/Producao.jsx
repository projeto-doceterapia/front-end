import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChefHat, PackageCheck, Truck } from 'lucide-react'
import { PageTop } from './Produtos'
import PedidoProducaoCard from '../../components/pedidos/PedidoProducaoCard'
import PaginacaoPedidos from '../../components/pedidos/PaginacaoPedidos'
import ResumoPedidos from '../../components/pedidos/ResumoPedidos'
import api from '../../services/api'
import { dataPedido } from '../../components/pedidos/pedidoUtils'

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

function dataISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export default function Producao({ onNewOrder }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [itens, setItens] = useState([])
  const [produtos, setProdutos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [filtro, setFiltro] = useState('todos')
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
        setErro('Não foi possível carregar os pedidos de produção. Verifique a conexão com o servidor.')
        console.error(error)
      }
    }
    carregar()
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

  const emAndamento = pedidos.filter((pedido) => !['ORCAMENTO', 'CANCELADO', 'ENTREGUE'].includes(pedido.statusPedido))
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

  function mudarFiltro(novoFiltro) {
    setFiltro(novoFiltro)
    setPagina(1)
  }

  return (
    <main className="orders-page production-page">
      <PageTop titulo="Produção" subtitulo="Acompanhe o que precisa ser produzido — pedidos confirmados em andamento" acao="Novo Pedido" aoClicar={onNewOrder} />
      <ResumoPedidos itens={resumo} />
      <section className="production-filters" aria-label="Filtrar pedidos de produção">
        {FILTROS.map(([valor, texto]) => (
          <button type="button" key={valor} className={filtro === valor ? 'selected' : ''} onClick={() => mudarFiltro(valor)}>{texto}</button>
        ))}
      </section>
      {erro && <p className="orders-error" role="alert">{erro}</p>}
      <section className="production-list" aria-label="Fila de produção">
        {pedidosPagina.map((pedido) => (
          <PedidoProducaoCard
            key={pedido.idPedido}
            pedido={pedido}
            clientes={clientes}
            itens={itens}
            produtos={produtos}
            pagamento={pagamentos.find((item) => Number(item.pedidoId ?? item.fkPedido) === Number(pedido.idPedido))}
          />
        ))}
        {!erro && visiveis.length === 0 && <p className="orders-empty">Nenhum pedido corresponde a este filtro.</p>}
      </section>
      {visiveis.length > 0 && <PaginacaoPedidos totalItens={visiveis.length} porPagina={ITENS_POR_PAGINA} pagina={Math.min(pagina, totalPaginas)} aoMudar={setPagina} />}
    </main>
  )
}