import './App.css'
import { useState } from 'react'
import Login from './app/pages/Login.jsx'
import Agenda from './app/pages/Agenda'
import Pedido from './app/pages/Pedido'
import VisaoGeral from './app/pages/VisaoGeral'
import Produtos from './app/pages/Produtos'
import Clientes from './app/pages/Clientes'
import Sidebar from './components/Sidebar'

function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(true)
  const [tela, setTela] = useState('agenda')

  if (!usuarioAutenticado) {
    return <Login onLogin={() => setUsuarioAutenticado(true)} />
  }

  function navegar(id) {
    setTela(id === 'pedidos' ? 'pedido' : id)
  }

  function renderizarTela() {
    if (tela === 'agenda') {
      return <Agenda onNewOrder={() => setTela('pedido')} />
    }

    if (tela === 'pedido') {
      return <Pedido onBack={() => setTela('agenda')} />
    }

    if (tela === 'visao-geral') {
      return <VisaoGeral />
    }

    if (tela === 'produtos') return <Produtos />
    if (tela === 'clientes') return <Clientes />

    return <Agenda onNewOrder={() => setTela('pedido')} />
  }

  const telaAtiva = tela === 'pedido' ? 'pedidos' : tela

  return (
    <div className="app-shell">
      <Sidebar telaAtual={telaAtiva} aoNavegar={navegar} />
      <div className="app-content">{renderizarTela()}</div>
    </div>
  )
}

export default App
