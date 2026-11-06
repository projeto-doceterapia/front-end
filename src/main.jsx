import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/index.css'
import './styles/orders.css'
import './styles/orders-workflow.css'
import './styles/notificacoes.css'
import './styles/usuarios.css'
import App from './App.jsx'
import ToastProvider from './components/feedback/ToastProvider.jsx'
import SessaoProvider from './components/sessao/SessaoProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <SessaoProvider>
        <App />
      </SessaoProvider>
    </ToastProvider>
  </StrictMode>,
)
