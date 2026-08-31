import CardResumo from '../../components/visao-geral/CardResumo'
import EstoqueAtencao from '../../components/visao-geral/EstoqueAtencao'
import GraficoFaturamento from '../../components/visao-geral/GraficoFaturamento'
import GraficoPedidos from '../../components/visao-geral/GraficoPedidos'
import PedidosAndamento from '../../components/visao-geral/PedidosAndamento'
import ProdutosMaisPedidos from '../../components/visao-geral/ProdutosMaisPedidos'

export default function VisaoGeral({ aoAbrirAgenda }) {
  return (
    <main className="dashboard">
      <header className="dashboard-heading">
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe os principais dados da confeitaria</p>
        </div>

        <button className="outline-button" onClick={aoAbrirAgenda}>Ir para agenda</button>
      </header>

      <section className="resumos">
        <CardResumo cor="rosa" icone="◉" titulo="Pedidos no mês" valor="21" detalhe="Abril de 2026" />
        <CardResumo cor="verde" icone="$" titulo="Faturamento" valor="R$ 3.420" detalhe="Neste mês" />
        <CardResumo cor="vermelho" icone="!" titulo="Estoque baixo" valor="3" detalhe="Itens para repor" />
        <CardResumo cor="rosa" icone="✓" titulo="Entregues" valor="14" detalhe="Neste mês" />
      </section>

      <EstoqueAtencao />
      <PedidosAndamento />
      <GraficoPedidos />
      <ProdutosMaisPedidos />
      <GraficoFaturamento />
    </main>
  )
}
