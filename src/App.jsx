import './App.css'
import { useState } from 'react'
import Login from './app/pages/Login.tsx'
import Agenda from './app/pages/Agenda'
import Pedido from './app/pages/Pedido'
import VisaoGeral from './app/pages/VisaoGeral'

function App() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false)
  const [tela, setTela] = useState('agenda')

  if (!usuarioAutenticado) {
    return <Login onLogin={() => setUsuarioAutenticado(true)} />
  }

  if (tela === 'agenda') {
    return <Agenda onNewOrder={() => setTela('pedido')} onOpenOverview={() => setTela('visao-geral')} />
  }

  if (tela === 'pedido') {
    return <Pedido onBack={() => setTela('agenda')} />
  }

  return <VisaoGeral aoAbrirAgenda={() => setTela('agenda')} />
}

export default App
