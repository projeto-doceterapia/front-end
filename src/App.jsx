import './App.css'
import { useState } from 'react'
import Login from './app/pages/Login.jsx'
import Agenda from './app/pages/Agenda'
import Pedido from './app/pages/Pedido'
import VisaoGeral from './app/pages/VisaoGeral'
import Produtos from './app/pages/Produtos'
import Clientes from './app/pages/Clientes'
import Estoque from './app/pages/Estoque'
import Producao from './app/pages/Producao'
import HistoricoPedidos from './app/pages/HistoricoPedidos'
import AppTopbar from './components/AppTopbar'
import Sidebar from './components/Sidebar'
import useSessao from './components/sessao/useSessao'

function App() {
  const { usuario, carregando } = useSessao()
  const [tela, setTela] = useState('agenda')
  const [origemPedido, setOrigemPedido] = useState('agenda')

  if (!usuario && tela !== 'agenda') {
    setTela('agenda')
  }

  if (carregando) {
    return <main className="login-page" role="status">Verificando sessão...</main>
  }

  if (!usuario) {
    return <Login />
  }

  function navegar(id) {
    if (id === 'pedidos' || id === 'registrar-pedido') {
      setOrigemPedido('agenda')
      setTela('pedido')
      return
    }
    setTela(id)
  }

  function criarPedido(origem) {
    setOrigemPedido(origem)
    setTela('pedido')
  }

  function renderizarTela() {
    if (tela === 'agenda') {
      return <Agenda onNewOrder={() => criarPedido('agenda')} />
    }

    if (tela === 'pedido') {
      return <Pedido onBack={() => setTela(origemPedido)} />
    }

    if (tela === 'producao') return <Producao onNewOrder={() => criarPedido('producao')} />
    if (tela === 'historico-pedidos') return <HistoricoPedidos onNewOrder={() => criarPedido('historico-pedidos')} />

    if (tela === 'visao-geral') {
      return <VisaoGeral />
    }

    if (tela === 'produtos') return <Produtos />
    if (tela === 'clientes') return <Clientes />
    if (tela === 'estoque') return <Estoque />

    return <Agenda onNewOrder={() => criarPedido('agenda')} />
  }

  return (
    <div className="app-shell">
      <Sidebar telaAtual={tela} aoNavegar={navegar} />
      <div className="app-content">
        <AppTopbar />
        {renderizarTela()}
      </div>
    </div>
  )
}

export default App
