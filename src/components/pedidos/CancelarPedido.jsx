import { useState } from 'react'
import ConfirmDialog from '../feedback/ConfirmDialog'
import useToast from '../feedback/useToast'
import { cancelarPedido } from '../../services/pedidos'
import DialogoPedido from './DialogoPedido'
import { mensagemErro, TIPO_CANCELAMENTO, TIPO_RETORNO } from './fluxoPedido'
import { codigoPedido } from './pedidoUtils'

function validar(dados) {
  const erros = {}
  if (!dados.tipoCancelamento) erros.tipoCancelamento = 'Selecione o motivo.'
  if (!dados.tipoRetorno) erros.tipoRetorno = 'Selecione o retorno.'
  if (dados.tipoRetorno === 'DEVOLUCAO' && (dados.valorRetorno === '' || Number(dados.valorRetorno) < 0)) {
    erros.valorRetorno = 'Informe o valor devolvido (zero ou mais).'
  }
  return erros
}

export default function CancelarPedido({ pedido, onFechar, onCancelado }) {
  const toast = useToast()
  const [dados, setDados] = useState({ tipoCancelamento: '', tipoRetorno: '', valorRetorno: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const devolucao = dados.tipoRetorno === 'DEVOLUCAO'
  const codigo = codigoPedido(pedido.idPedido)

  function alterar(event) {
    const { name, value } = event.target
    setDados((atual) => ({ ...atual, [name]: value }))
  }

  function revisar(event) {
    event.preventDefault()
    const encontrados = validar(dados)
    setErros(encontrados)
    if (!Object.keys(encontrados).length) setConfirmando(true)
  }

  async function enviar() {
    if (enviando) return
    setEnviando(true)
    try {
      await cancelarPedido(pedido.idPedido, {
        tipoCancelamento: dados.tipoCancelamento,
        tipoRetorno: dados.tipoRetorno,
        valorRetorno: devolucao ? Number(dados.valorRetorno) : null,
        observacao: dados.observacao.trim() || null,
      })
      toast.sucesso(`Pedido ${codigo} cancelado.`)
      onCancelado({ ...pedido, statusPedido: 'CANCELADO' })
      onFechar()
    } catch (erro) {
      setConfirmando(false)
      setEnviando(false)
      toast.erro(mensagemErro(erro))
    }
  }

  function campoErro(nome) {
    return erros[nome] ? { 'aria-invalid': true, 'aria-describedby': `cancelar-${nome}-erro` } : {}
  }

  function mensagemCampo(nome) {
    return erros[nome] && <small id={`cancelar-${nome}-erro`} className="pedido-campo-erro">{erros[nome]}</small>
  }

  const rodape = (
    <>
      <button type="button" className="order-action" disabled={enviando} onClick={onFechar}>Voltar</button>
      <button type="submit" form="form-cancelar-pedido" className="order-action order-action-danger" disabled={enviando}>Cancelar pedido</button>
    </>
  )

  return (
    <DialogoPedido titulo={`Cancelar pedido ${codigo}`} ocupado={enviando} onFechar={onFechar} rodape={rodape}>
      <form id="form-cancelar-pedido" className="pedido-form" onSubmit={revisar} noValidate>
        <label>
          Motivo
          <select name="tipoCancelamento" value={dados.tipoCancelamento} onChange={alterar} {...campoErro('tipoCancelamento')}>
            <option value="">Selecione</option>
            {Object.entries(TIPO_CANCELAMENTO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
          {mensagemCampo('tipoCancelamento')}
        </label>
        <label>
          Retorno para a cliente
          <select name="tipoRetorno" value={dados.tipoRetorno} onChange={alterar} {...campoErro('tipoRetorno')}>
            <option value="">Selecione</option>
            {Object.entries(TIPO_RETORNO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
          {mensagemCampo('tipoRetorno')}
        </label>
        {devolucao && (
          <label>
            Valor devolvido (R$)
            <input type="number" name="valorRetorno" min="0" step="0.01" value={dados.valorRetorno} onChange={alterar} {...campoErro('valorRetorno')} />
            {mensagemCampo('valorRetorno')}
          </label>
        )}
        <label>
          Observação (opcional)
          <textarea name="observacao" value={dados.observacao} onChange={alterar} rows={3} />
        </label>
      </form>
      <ConfirmDialog
        aberto={confirmando}
        titulo={`Cancelar o pedido ${codigo}?`}
        mensagem="O cancelamento não pode ser desfeito e o pedido não muda mais de fase."
        textoConfirmar="Cancelar pedido"
        textoCancelar="Voltar"
        perigoso
        ocupado={enviando}
        onConfirm={enviar}
        onCancel={() => setConfirmando(false)}
      />
    </DialogoPedido>
  )
}
