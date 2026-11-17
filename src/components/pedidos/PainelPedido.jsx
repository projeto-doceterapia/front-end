import { useState } from 'react'
import CancelarPedido from './CancelarPedido'
import DetalhePedido from './DetalhePedido'
import EditarPedido from './EditarPedido'
import { pagamentoDoPedido } from './pedidoUtils'

// Opens the detail, or the edit form directly; edit and cancel opened from the detail stack on top of it.
export default function PainelPedido({ pedido, modoInicial, clientes, itens, produtos, pagamentos, onFechar, onPedidoAtualizado }) {
  const [sobreposto, setSobreposto] = useState(null)
  const comDetalhe = modoInicial === 'detalhe'

  function fecharSobreposto() {
    if (comDetalhe) setSobreposto(null)
    else onFechar()
  }

  const formulario = comDetalhe ? sobreposto : modoInicial

  return (
    <>
      {comDetalhe && (
        <DetalhePedido
          pedido={pedido}
          clientes={clientes}
          itens={itens}
          produtos={produtos}
          pagamento={pagamentoDoPedido(pedido, pagamentos)}
          onFechar={onFechar}
          onPedidoAtualizado={onPedidoAtualizado}
          onEditar={() => setSobreposto('editar')}
          onCancelar={() => setSobreposto('cancelar')}
        />
      )}
      {formulario === 'editar' && (
        <EditarPedido pedido={pedido} clientes={clientes} onFechar={fecharSobreposto} onPedidoAtualizado={onPedidoAtualizado} />
      )}
      {formulario === 'cancelar' && (
        <CancelarPedido pedido={pedido} onFechar={fecharSobreposto} onCancelado={onPedidoAtualizado} />
      )}
    </>
  )
}
