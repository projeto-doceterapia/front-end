import { useEffect, useState } from 'react'
import CabecalhoAgenda from '../../components/agenda/CabecalhoAgenda'
import Calendario from '../../components/agenda/Calendario'
import ListaPedidos from '../../components/agenda/ListaPedidos'
import ResumoAgenda from '../../components/agenda/ResumoAgenda'
import ConfiguracaoFarol from '../../components/agenda/ConfiguracaoFarol'
import api from '../../services/api'
import { carregarDadosTeste } from '../../services/dadosTeste'
import FiltroPeriodoPedidos from '../../components/pedidos/FiltroPeriodoPedidos'
import useRecortePedidos from '../../components/pedidos/useRecortePedidos'
import { dataISO, filtroAberturaAgenda, filtroDoMes, formatarDataCompleta, periodoCobreMes } from '../../components/pedidos/filtrosUtils'

export default function Agenda({ onNewOrder }) {
  const hoje = new Date()
  const recorte = useRecortePedidos(filtroAberturaAgenda)
  const { pedidos, itens, pagamentos, carregando, erro } = recorte
  const [produtos, setProdutos] = useState([])
  const [farol, setFarol] = useState(null)
  const [mostrarFarol, setMostrarFarol] = useState(false)
  const [dadosFarol, setDadosFarol] = useState({ limiteVerde: '', limiteAmarelo: '', limiteVermelho: '' })
  const [salvandoFarol, setSalvandoFarol] = useState(false)
  const [erroFarol, setErroFarol] = useState('')
  const [mesExibido, setMesExibido] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [dataSelecionada, setDataSelecionada] = useState(dataISO(hoje))
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function buscarCatalogos() {
    try {
      const respostaProdutos = await api.get('/produtos')
      setProdutos(respostaProdutos.data || [])
    } catch (falha) {
      console.error('Não foi possível carregar os produtos:', falha)
    }

    try {
      const respostaFarol = await api.get('/configuracao-farol')
      setFarol(respostaFarol.data)
    } catch {
      setFarol(null)
    }
  }

  useEffect(() => {
    buscarCatalogos()
  }, [])

  async function preencherDadosTeste() {
    setCarregandoDados(true)
    setMensagem('')

    try {
      await carregarDadosTeste()
      await Promise.all([buscarCatalogos(), recorte.carregar(recorte.filtro)])
      setMensagem('Dados de teste carregados. Agora crie um pedido pela tela.')
    } catch (erro) {
      setMensagem('Não foi possível carregar os dados. Verifique se o backend está em execução.')
      console.error(erro)
    } finally {
      setCarregandoDados(false)
    }
  }

  function mudarMes(variacao) {
    const novoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + variacao, 1)
    setMesExibido(novoMes)
    setDataSelecionada(dataISO(novoMes))
  }

  function irParaHoje() {
    const agora = new Date()
    setMesExibido(new Date(agora.getFullYear(), agora.getMonth(), 1))
    setDataSelecionada(dataISO(agora))
  }

  function abrirConfiguracaoFarol() {
    setDadosFarol({
      limiteVerde: farol?.limiteVerde ?? '',
      limiteAmarelo: farol?.limiteAmarelo ?? '',
      limiteVermelho: farol?.limiteVermelho ?? '',
    })
    setErroFarol('')
    setMostrarFarol(true)
  }

  function alterarFarol(evento) {
    setDadosFarol({ ...dadosFarol, [evento.target.name]: evento.target.value })
  }

  async function salvarFarol(evento) {
    evento.preventDefault()
    const configuracao = {
      limiteVerde: Number(dadosFarol.limiteVerde),
      limiteAmarelo: Number(dadosFarol.limiteAmarelo),
      limiteVermelho: Number(dadosFarol.limiteVermelho),
    }

    if (Object.values(dadosFarol).some((valor) => valor === '') || configuracao.limiteVerde >= configuracao.limiteAmarelo || configuracao.limiteAmarelo >= configuracao.limiteVermelho) {
      setErroFarol('Use limites crescentes: verde menor que amarelo e amarelo menor que vermelho.')
      return
    }

    setSalvandoFarol(true)
    setErroFarol('')
    try {
      const resposta = farol
        ? await api.put('/configuracao-farol', configuracao)
        : await api.post('/configuracao-farol', configuracao)
      setFarol(resposta.data)
      setMostrarFarol(false)
    } catch (erro) {
      setErroFarol('Não foi possível salvar a configuração. Tente novamente.')
      console.error(erro)
    } finally {
      setSalvandoFarol(false)
    }
  }

  const pedidosDoMes = pedidos.filter((pedido) => {
    const data = pedido.dataEntrega || ''
    return data.startsWith(`${mesExibido.getFullYear()}-${String(mesExibido.getMonth() + 1).padStart(2, '0')}`)
  })

  const mesCoberto = periodoCobreMes(recorte.filtro, mesExibido)

  return (
    <main className="agenda-page">
      <CabecalhoAgenda aoCriarPedido={onNewOrder} aoCarregarDadosTeste={preencherDadosTeste} carregandoDados={carregandoDados} />
      {mensagem && <p className="form-error order-error">{mensagem}</p>}
      <ResumoAgenda pedidos={pedidosDoMes} aoConfigurarFarol={abrirConfiguracaoFarol} />
      <FiltroPeriodoPedidos
        filtro={recorte.filtro}
        opcaoCancelados
        carregando={carregando}
        onAplicar={recorte.carregar}
        onRestaurar={() => recorte.carregar(filtroAberturaAgenda())}
      />
      {!mesCoberto && (
        <p className="agenda-month-hint">
          O mês exibido não está todo no período carregado.
          <button type="button" className="outline-button" onClick={() => recorte.carregar(filtroDoMes(mesExibido, recorte.filtro.status))} disabled={carregando}>Carregar este mês</button>
        </p>
      )}
      {erro && <p className="orders-error" role="alert">{erro}</p>}
      {carregando && <p className="orders-empty orders-loading" role="status">Carregando pedidos...</p>}
      {!carregando && !erro && !pedidos.length && <p className="orders-empty">Nenhum pedido com entrega entre {formatarDataCompleta(recorte.filtro.de)} e {formatarDataCompleta(recorte.filtro.ate)}.</p>}

      <section className="agenda-layout" aria-busy={carregando}>
        <Calendario
          pedidos={pedidos}
          periodo={recorte.filtro}
          farol={farol}
          mesExibido={mesExibido}
          dataSelecionada={dataSelecionada}
          aoMudarMes={mudarMes}
          aoIrParaHoje={irParaHoje}
          aoSelecionarData={setDataSelecionada}
        />
        <ListaPedidos
          pedidos={pedidos}
          pagamentos={pagamentos}
          itens={itens}
          produtos={produtos}
          dataSelecionada={dataSelecionada}
        />
      </section>
      {mostrarFarol && <ConfiguracaoFarol dados={dadosFarol} aoAlterar={alterarFarol} aoSalvar={salvarFarol} aoFechar={() => setMostrarFarol(false)} salvando={salvandoFarol} erro={erroFarol} />}
    </main>
  )
}
