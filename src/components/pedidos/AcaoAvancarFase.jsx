import { useRef, useState } from 'react'
import ConfirmDialog from '../feedback/ConfirmDialog'
import useToast from '../feedback/useToast'
import { avancarStatus } from '../../services/pedidos'
import { CONFIRMACAO_FASE, mensagemErro, proximaFase, ROTULO_ACAO_FASE } from './fluxoPedido'
import { codigoPedido, textoStatus } from './pedidoUtils'

export default function AcaoAvancarFase({ pedido, onPedidoAtualizado }) {
  const toast = useToast()
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // State updates land after the next click event, so a ref blocks the double submit synchronously.
  const emCurso = useRef(false)
  const statusAtual = pedido.statusPedido
  const proxima = proximaFase(statusAtual)
  if (!proxima) return null
  const confirmacao = CONFIRMACAO_FASE[statusAtual]

  // Single place for API refusals of the transition, including the 422 of the supply check.
  function tratarErro(erro) {
    toast.erro(mensagemErro(erro))
  }

  async function avancar() {
    if (emCurso.current) return
    emCurso.current = true
    setEnviando(true)
    try {
      const atualizado = await avancarStatus(pedido.idPedido, proxima)
      toast.sucesso(`Pedido ${codigoPedido(pedido.idPedido)} agora está em ${textoStatus(atualizado.statusPedido)}.`)
      setConfirmando(false)
      onPedidoAtualizado(atualizado)
    } catch (erro) {
      setConfirmando(false)
      tratarErro(erro)
    } finally {
      emCurso.current = false
      setEnviando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="order-action order-action-primary"
        disabled={enviando}
        onClick={() => (confirmacao ? setConfirmando(true) : avancar())}
      >
        {ROTULO_ACAO_FASE[statusAtual]}
      </button>
      {confirmacao && (
        <ConfirmDialog
          aberto={confirmando}
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          textoConfirmar={ROTULO_ACAO_FASE[statusAtual]}
          textoCancelar="Voltar"
          perigoso={confirmacao.perigoso}
          ocupado={enviando}
          onConfirm={avancar}
          onCancel={() => setConfirmando(false)}
        />
      )}
    </>
  )
}
