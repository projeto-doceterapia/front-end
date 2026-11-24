import { useState } from 'react'
import useToast from '../feedback/useToast'
import { mensagemErro } from '../pedidos/fluxoPedido'
import { DialogoFaltaInsumoDaSessao } from './DialogoFaltaInsumo'
import { extrairFaltas } from './viabilidadeUtils'

const CANCELADO = { cancelado: true }
const SUCESSO_PADRAO = 'Pedido confirmado com falta de insumo.'

export default function useConfirmacaoComFalta() {
  const toast = useToast()
  const [pendente, setPendente] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  async function executar(chamada, { onFaltas, mensagemSucesso = SUCESSO_PADRAO } = {}) {
    try {
      return { cancelado: false, comFalta: false, dados: await chamada(false) }
    } catch (erro) {
      const faltas = extrairFaltas(erro)
      if (!faltas) throw erro
      onFaltas?.()
      return new Promise((resolver) => {
        setPendente({ faltas, mensagem: erro.response.data.message, chamada, mensagemSucesso, resolver })
      })
    }
  }

  async function confirmarMesmoAssim() {
    setOcupado(true)
    try {
      const dados = await pendente.chamada(true)
      toast.sucesso(pendente.mensagemSucesso)
      pendente.resolver({ cancelado: false, comFalta: true, dados })
    } catch (erro) {
      toast.erro(mensagemErro(erro, 'Não foi possível confirmar o pedido.'))
      pendente.resolver(CANCELADO)
    } finally {
      setOcupado(false)
      setPendente(null)
    }
  }

  function fechar() {
    pendente.resolver(CANCELADO)
    setPendente(null)
  }

  const dialogo = pendente && (
    <DialogoFaltaInsumoDaSessao
      mensagem={pendente.mensagem}
      faltas={pendente.faltas}
      ocupado={ocupado}
      onConfirmarMesmoAssim={confirmarMesmoAssim}
      onFechar={fechar}
    />
  )

  return { executar, dialogo }
}
