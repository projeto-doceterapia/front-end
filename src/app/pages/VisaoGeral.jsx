import { useEffect, useState } from 'react'
import CardResumo from '../../components/visao-geral/CardResumo'
import EstoqueAtencao from '../../components/visao-geral/EstoqueAtencao'
import Filtros from '../../components/visao-geral/Filtros'
import GraficoFaturamento from '../../components/visao-geral/GraficoFaturamento'
import GraficoPedidos from '../../components/visao-geral/GraficoPedidos'
import PedidosAndamento from '../../components/visao-geral/PedidosAndamento'
import ProdutosMaisPedidos from '../../components/visao-geral/ProdutosMaisPedidos'
import { mesAtual } from '../../components/visao-geral/periodoUtils'
import useSessao from '../../components/sessao/useSessao'
import { buscarFinanceiros, buscarOperacionais } from '../../services/indicadores'

const RESSALVA_LUCRO = 'Estimativa: compara o faturamento das entregas com as compras do período, não o consumo exato de insumos.'

export default function VisaoGeral() {
  const { ehDona } = useSessao()
  const [periodo, setPeriodo] = useState(() => mesAtual(new Date()))
  const [tentativa, setTentativa] = useState(0)
  const [estado, setEstado] = useState({ carregando: true, erro: false, operacionais: null, financeiros: null })

  useEffect(() => {
    let ativo = true
    Promise.all([buscarOperacionais(periodo), ehDona ? buscarFinanceiros(periodo) : Promise.resolve(null)])
      .then(([operacionais, financeiros]) => {
        if (ativo) setEstado({ carregando: false, erro: false, operacionais, financeiros })
      })
      .catch(() => {
        if (ativo) setEstado({ carregando: false, erro: true, operacionais: null, financeiros: null })
      })
    return () => { ativo = false }
  }, [periodo, ehDona, tentativa])

  function alterarPeriodo(novo) {
    setEstado((atual) => ({ ...atual, carregando: true, erro: false }))
    setPeriodo(novo)
  }

  function tentarNovamente() {
    setEstado((atual) => ({ ...atual, carregando: true, erro: false }))
    setTentativa((valor) => valor + 1)
  }

  const { carregando, erro, operacionais, financeiros } = estado
  const semPedidos = operacionais && Object.values(operacionais.pedidosPorStatus).every((quantidade) => quantidade === 0)

  return (
    <main className="dashboard" aria-busy={carregando}>
      <header className="dashboard-heading"><div><h1>Visão Geral</h1><p>Acompanhe o desempenho e tome decisões com clareza</p></div></header>
      <Filtros de={periodo.de} ate={periodo.ate} onChange={alterarPeriodo} />
      {carregando && <p className="empty-dashboard" role="status">Carregando indicadores...</p>}
      {erro && (
        <div className="erro-dashboard" role="alert">
          <p>Não foi possível carregar a Visão Geral. Verifique a conexão com o servidor.</p>
          <button type="button" onClick={tentarNovamente}>Tentar novamente</button>
        </div>
      )}
      {!carregando && !erro && operacionais && (
        <>
          {semPedidos && <p className="empty-dashboard" role="status">Nenhum pedido com entrega neste período.</p>}
          <section className="resumos">
            {ehDona && financeiros && <CardsFinanceiros financeiros={financeiros} />}
            <CardResumo cor="vermelho" icone="□" titulo="Dias lotados" valor={operacionais.diasLotados.length} detalhe="dias marcados em vermelho no farol" />
          </section>
          <EstoqueAtencao insumos={operacionais.insumosAbaixoDoMinimo} />
          <PedidosAndamento pedidosPorStatus={operacionais.pedidosPorStatus} />
          <GraficoPedidos pedidosPorDia={operacionais.pedidosPorDia} de={periodo.de} ate={periodo.ate} />
          <ProdutosMaisPedidos produtos={operacionais.produtosMaisVendidos} />
          {ehDona && financeiros && <GraficoFaturamento faturamentoPorMes={financeiros.faturamentoPorMes} />}
        </>
      )}
    </main>
  )
}

function CardsFinanceiros({ financeiros }) {
  const { faturamento, cancelados, emOrcamento } = financeiros
  return (
    <>
      <CardResumo cor="rosa" icone="$" titulo="Faturamento" valor={dinheiro(faturamento.total)} detalhe={`Recebido ${dinheiro(faturamento.recebido)} · A receber ${dinheiro(faturamento.aReceber)}`} />
      <CardResumo cor="marrom" icone="▣" titulo="Ticket médio" valor={dinheiro(financeiros.ticketMedio)} detalhe="faturamento por pedido do período" />
      <CardResumo cor="verde" icone="↗" titulo="Gastos com insumos" valor={dinheiro(financeiros.gastosInsumos)} detalhe="compras lançadas no período" />
      <CardResumo cor="rosa" icone="$" titulo="Lucro estimado" valor={dinheiro(financeiros.lucroEstimado)} detalhe={RESSALVA_LUCRO} />
      <CardResumo cor="verde" icone="%" titulo="Margem" valor={`${Number(financeiros.margem).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} detalhe="lucro estimado sobre o faturamento" />
      <CardResumo cor="amarelo" icone="○" titulo="Em orçamento" valor={dinheiro(emOrcamento.valor)} detalhe={`${emOrcamento.quantidade} pedidos`} />
      <CardResumo cor="marrom" icone="×" titulo="Cancelados" valor={cancelados.quantidade} detalhe={`Pago ${dinheiro(cancelados.pago)} · Devolvido ${dinheiro(cancelados.devolvido)} · Retido ${dinheiro(cancelados.retido)}`} />
    </>
  )
}

function dinheiro(valor) { return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
