import './App.css'
import { useState } from 'react'
import Login from './app/pages/Login.tsx'
import CardResumo from './components/CardResumo'
import EstoqueAtencao from './components/EstoqueAtencao'
import PedidosAndamento from './components/PedidosAndamento'
import GraficoPedidos from './components/GraficoPedidos'
import ProdutosMaisPedidos from './components/ProdutosMaisPedidos'
import GraficoFaturamento from './components/GraficoFaturamento'

function VisaoGeral() {
  return (
    <main className="dashboard">
      <header>
        <h1>Visão Geral</h1>
        <p>Acompanhe o desempenho e tome decisões com clareza</p>
      </header>

      <section className="resumos">
        <CardResumo icone="$" titulo="Lucro" valor="R$ 7.000,00" detalhe="vendas menos custos cadastrados" cor="rosa" />
        <CardResumo icone="▣" titulo="Custo total" valor="R$ 3.200,00" detalhe="soma dos custos dos pedidos" cor="marrom" />
        <CardResumo icone="⌁" titulo="Margem de lucro" valor="69%" detalhe="percentual médio dos pedidos" cor="verde" />
        <CardResumo icone="▣" titulo="Dias lotados" valor="3" detalhe="dias marcados em vermelho" cor="vermelho" />
      </section>

      <EstoqueAtencao />
      <PedidosAndamento />
      <GraficoPedidos />
      <ProdutosMaisPedidos />
      <GraficoFaturamento />
    </main>
  )
}

function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false)

  if (!usuarioAutenticado) {
    return <Login onLogin={() => setUsuarioAutenticado(true)} />
  }

  return <VisaoGeral />
}

export default App
