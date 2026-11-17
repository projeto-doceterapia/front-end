import { useRef, useState } from 'react'
import ConfirmDialog from '../feedback/ConfirmDialog'
import useToast from '../feedback/useToast'
import useConfirmacaoComFalta from '../pedido/useConfirmacaoComFalta'
import { avancarStatus } from '../../services/pedidos'
import { CONFIRMACAO_FASE, mensagemErro, proximaFase, ROTULO_ACAO_FASE } from './fluxoPedido'
import { codigoPedido, textoStatus } from './pedidoUtils'

export default function AcaoAvancarFase({ pedido, onPedidoAtualizado }) {
  const toast = useToast()
  const { executar, dialogo } = useConfirmacaoComFalta()
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // State updates land after the next click event, so a ref blocks the double submit synchronously.
  const emCurso = useRef(false)
  const statusAtual = pedido.statusPedido
  const proxima = proximaFase(statusAtual)
  if (!proxima) return null
  const confirmacao = CONFIRMACAO_FASE[statusAtual]

  async function avancar() {
    if (emCurso.current) return
    emCurso.current = true
    setEnviando(true)
    try {
      const resultado = await executar(
        (confirmarComFalta) => avancarStatus(pedido.idPedido, proxima, confirmarComFalta),
        { onFaltas: () => setConfirmando(false) },
      )
      setConfirmando(false)
      if (resultado.cancelado) return
      const atualizado = resultado.dados
      if (!resultado.comFalta) toast.sucesso(`Pedido ${codigoPedido(pedido.idPedido)} agora está em ${textoStatus(atualizado.statusPedido)}.`)
      onPedidoAtualizado(atualizado)
    } catch (erro) {
      setConfirmando(false)
      toast.erro(mensagemErro(erro))
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
      {dialogo}
    </>
  )
}
