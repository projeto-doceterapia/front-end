import { useEffect, useState } from 'react'
import CabecalhoAgenda from '../../components/agenda/CabecalhoAgenda'
import Calendario from '../../components/agenda/Calendario'
import ListaPedidos from '../../components/agenda/ListaPedidos'
import ResumoAgenda from '../../components/agenda/ResumoAgenda'
import ConfiguracaoFarol from '../../components/agenda/ConfiguracaoFarol'
import api from '../../services/api'
import { carregarDadosTeste } from '../../services/dadosTeste'

function dataISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export default function Agenda({ onNewOrder }) {
  const hoje = new Date()
  const [pedidos, setPedidos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [itens, setItens] = useState([])
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

  async function buscarDados() {
    try {
      const respostas = await Promise.all([
        api.get('/pedidos'), api.get('/pagamentos'), api.get('/itens-pedido'), api.get('/produtos'),
      ])
      setPedidos(respostas[0].data || [])
      setPagamentos(respostas[1].data || [])
      setItens(respostas[2].data || [])
      setProdutos(respostas[3].data || [])

      try {
        const respostaFarol = await api.get('/configuracao-farol')
        setFarol(respostaFarol.data)
      } catch {
        setFarol(null)
      }
    } catch (erro) {
      console.error('Nao foi possivel carregar a agenda:', erro)
    }
  }

  useEffect(() => {
    buscarDados()
  }, [])

  async function preencherDadosTeste() {
    setCarregandoDados(true)
    setMensagem('')

    try {
      await carregarDadosTeste()
      await buscarDados()
      setMensagem('Dados de teste carregados. Agora crie um pedido pela tela.')
    } catch (erro) {
      setMensagem('Nao foi possivel carregar os dados. Verifique se o backend esta em execucao.')
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
      setErroFarol('Use limites crescentes: verde menor que amarelo, e amarelo menor que vermelho.')
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
      setErroFarol('Nao foi possivel salvar a configuracao. Tente novamente.')
      console.error(erro)
    } finally {
      setSalvandoFarol(false)
    }
  }

  const pedidosDoMes = pedidos.filter((pedido) => {
    const data = pedido.dataEntrega || ''
    return data.startsWith(`${mesExibido.getFullYear()}-${String(mesExibido.getMonth() + 1).padStart(2, '0')}`)
  })

  return (
    <main className="agenda-page">
      <CabecalhoAgenda aoCriarPedido={onNewOrder} aoCarregarDadosTeste={preencherDadosTeste} carregandoDados={carregandoDados} />
      {mensagem && <p className="form-error order-error">{mensagem}</p>}
      <ResumoAgenda pedidos={pedidosDoMes} aoConfigurarFarol={abrirConfiguracaoFarol} />

      <section className="agenda-layout">
        <Calendario
          pedidos={pedidos}
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
