import './App.css'
import { useState } from 'react'
import Login from './app/pages/Login.jsx'
import Agenda from './app/pages/Agenda'
import Pedido from './app/pages/Pedido'
import VisaoGeral from './app/pages/VisaoGeral'
import Produtos from './app/pages/Produtos'
import Clientes from './app/pages/Clientes'
import Producao from './app/pages/Producao'
import HistoricoPedidos from './app/pages/HistoricoPedidos'
import AppTopbar from './components/AppTopbar'
import Sidebar from './components/Sidebar'

function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(true)
  const [tela, setTela] = useState('agenda')
  const [origemPedido, setOrigemPedido] = useState('agenda')

  if (!usuarioAutenticado) {
    return <Login onLogin={() => setUsuarioAutenticado(true)} />
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

    return <Agenda onNewOrder={() => criarPedido('agenda')} />
  }

  return (
    <div className="app-shell">
      <Sidebar telaAtual={tela} aoNavegar={navegar} />
      <div className="app-content">
        <AppTopbar aoNavegar={setTela} />
        {renderizarTela()}
      </div>
    </div>
  )
}

export default App
