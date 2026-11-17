import { useState } from 'react'
import useToast from '../feedback/useToast'
import { atualizarPedido } from '../../services/pedidos'
import DialogoPedido from './DialogoPedido'
import { mensagemErro } from './fluxoPedido'
import { codigoPedido, dataPedido } from './pedidoUtils'

function dadosIniciais(pedido) {
  return {
    clienteId: pedido.clienteId ?? pedido.fkCliente ?? '',
    formaEntrega: pedido.formaEntrega || 'RETIRADA',
    enderecoEntrega: pedido.enderecoEntrega || '',
    cep: pedido.cep || '',
    dataEntrega: dataPedido(pedido),
    anotacao: pedido.anotacao || '',
  }
}

function validar(dados) {
  const erros = {}
  if (!dados.clienteId) erros.clienteId = 'Selecione o cliente.'
  if (!dados.dataEntrega) erros.dataEntrega = 'Informe a data de entrega.'
  if (dados.formaEntrega === 'ENTREGA' && !dados.enderecoEntrega.trim()) erros.enderecoEntrega = 'Informe o endereço de entrega.'
  if (dados.cep && !/^\d{8}$/.test(dados.cep)) erros.cep = 'O CEP deve ter 8 dígitos, sem traço.'
  return erros
}

export default function EditarPedido({ pedido, clientes, onFechar, onPedidoAtualizado }) {
  const toast = useToast()
  const [dados, setDados] = useState(() => dadosIniciais(pedido))
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const entrega = dados.formaEntrega === 'ENTREGA'

  function alterar(event) {
    const { name, value } = event.target
    setDados((atual) => ({ ...atual, [name]: value }))
  }

  async function salvar(event) {
    event.preventDefault()
    if (enviando) return
    const encontrados = validar(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return
    setEnviando(true)
    try {
      // The phase only changes through the status route, so the loaded phase is sent back untouched.
      const atualizado = await atualizarPedido(pedido.idPedido, {
        clienteId: Number(dados.clienteId),
        tipoPedido: pedido.tipoPedido,
        statusPedido: pedido.statusPedido,
        formaEntrega: dados.formaEntrega,
        enderecoEntrega: entrega ? dados.enderecoEntrega.trim() : null,
        cep: entrega && dados.cep ? dados.cep : null,
        dataEntrega: dados.dataEntrega,
        anotacao: dados.anotacao.trim() || null,
      })
      toast.sucesso(`Pedido ${codigoPedido(pedido.idPedido)} atualizado.`)
      onPedidoAtualizado(atualizado)
      onFechar()
    } catch (erro) {
      toast.erro(mensagemErro(erro))
      setEnviando(false)
    }
  }

  function campoErro(nome) {
    return erros[nome] ? { 'aria-invalid': true, 'aria-describedby': `editar-${nome}-erro` } : {}
  }

  function mensagemCampo(nome) {
    return erros[nome] && <small id={`editar-${nome}-erro`} className="pedido-campo-erro">{erros[nome]}</small>
  }

  const rodape = (
    <>
      <button type="button" className="order-action" disabled={enviando} onClick={onFechar}>Voltar</button>
      <button type="submit" form="form-editar-pedido" className="order-action order-action-primary" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </>
  )

  return (
    <DialogoPedido titulo={`Editar pedido ${codigoPedido(pedido.idPedido)}`} ocupado={enviando} onFechar={onFechar} rodape={rodape}>
      <form id="form-editar-pedido" className="pedido-form" onSubmit={salvar} noValidate>
        <label>
          Cliente
          <select name="clienteId" value={dados.clienteId} onChange={alterar} {...campoErro('clienteId')}>
            <option value="">Selecione</option>
            {clientes.map((cliente) => <option key={cliente.idCliente} value={cliente.idCliente}>{cliente.nome}</option>)}
          </select>
          {mensagemCampo('clienteId')}
        </label>
        <label>
          Forma de entrega
          <select name="formaEntrega" value={dados.formaEntrega} onChange={alterar}>
            <option value="RETIRADA">Retirada</option>
            <option value="ENTREGA">Entrega</option>
          </select>
        </label>
        {entrega && (
          <>
            <label>
              Endereço de entrega
              <input name="enderecoEntrega" value={dados.enderecoEntrega} onChange={alterar} maxLength={255} {...campoErro('enderecoEntrega')} />
              {mensagemCampo('enderecoEntrega')}
            </label>
            <label>
              CEP (opcional)
              <input name="cep" value={dados.cep} onChange={alterar} inputMode="numeric" maxLength={8} {...campoErro('cep')} />
              {mensagemCampo('cep')}
            </label>
          </>
        )}
        <label>
          Data de entrega
          <input type="date" name="dataEntrega" value={dados.dataEntrega} onChange={alterar} {...campoErro('dataEntrega')} />
          {mensagemCampo('dataEntrega')}
        </label>
        <label>
          Anotação
          <textarea name="anotacao" value={dados.anotacao} onChange={alterar} rows={3} />
        </label>
      </form>
    </DialogoPedido>
  )
}
