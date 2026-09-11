import { useEffect, useState } from 'react'
import CardResumo from '../../components/visao-geral/CardResumo'
import EstoqueAtencao from '../../components/visao-geral/EstoqueAtencao'
import GraficoFaturamento from '../../components/visao-geral/GraficoFaturamento'
import GraficoPedidos from '../../components/visao-geral/GraficoPedidos'
import PedidosAndamento from '../../components/visao-geral/PedidosAndamento'
import ProdutosMaisPedidos from '../../components/visao-geral/ProdutosMaisPedidos'
import api from '../../services/api'

export default function VisaoGeral() {
  const [dados, setDados] = useState({ pedidos: [], insumos: [], produtos: [], itens: [], farol: null })

  async function buscarDados() {
    try {
      const respostas = await Promise.all([
        api.get('/pedidos'), api.get('/insumos'), api.get('/produtos'), api.get('/itens-pedido'),
      ])
      let farol = null
      try { farol = (await api.get('/configuracao-farol')).data } catch { farol = null }

      setDados({
        pedidos: respostas[0].data || [],
        insumos: respostas[1].data || [],
        produtos: respostas[2].data || [],
        itens: respostas[3].data || [],
        farol,
      })
    } catch (erro) {
      console.error('Nao foi possivel carregar a visao geral:', erro)
    }
  }

  useEffect(() => { buscarDados() }, [])

  const estoqueBaixo = dados.insumos.filter((item) => Number(item.quantidadeAtual) <= Number(item.quantidadeMinima))
  const faturamento = dados.itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)
  const custoTotal = dados.itens.reduce((soma, item) => soma + Number(item.custoEstimadoItem || 0), 0)
  const lucro = faturamento - custoTotal
  const margem = faturamento ? (lucro / faturamento) * 100 : 0
  const diasLotados = contarDiasLotados(dados.pedidos, dados.farol)

  return (
    <main className="dashboard">
      <header className="dashboard-heading"><div><h1>Visao Geral</h1><p>Acompanhe o desempenho e tome decisoes com clareza</p></div></header>
      <section className="resumos">
        <CardResumo cor="rosa" icone="$" titulo="Lucro" valor={dinheiro(lucro)} detalhe="vendas menos custos cadastrados" />
        <CardResumo cor="marrom" icone="▣" titulo="Custo total" valor={dinheiro(custoTotal)} detalhe="soma dos custos dos pedidos" />
        <CardResumo cor="verde" icone="↗" titulo="Margem de lucro" valor={`${margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} detalhe="percentual medio dos pedidos" />
        <CardResumo cor="vermelho" icone="□" titulo="Dias lotados" valor={diasLotados} detalhe={dados.farol ? 'dias marcados em vermelho' : 'configure o farol para calcular'} />
      </section>
      <EstoqueAtencao insumos={estoqueBaixo} />
      <PedidosAndamento pedidos={dados.pedidos} />
      <GraficoPedidos pedidos={dados.pedidos} />
      <ProdutosMaisPedidos produtos={dados.produtos} itens={dados.itens} pedidos={dados.pedidos} />
      <GraficoFaturamento itens={dados.itens} pedidos={dados.pedidos} />
    </main>
  )
}

function contarDiasLotados(pedidos, farol) {
  if (!farol?.limiteVermelho) return 0
  const quantidadePorDia = pedidos.reduce((mapa, pedido) => {
    if (pedido.dataEntrega) mapa[pedido.dataEntrega] = (mapa[pedido.dataEntrega] || 0) + 1
    return mapa
  }, {})
  return Object.values(quantidadePorDia).filter((quantidade) => quantidade >= farol.limiteVermelho).length
}

function dinheiro(valor) { return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
