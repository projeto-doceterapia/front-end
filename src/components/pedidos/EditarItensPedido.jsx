import { useState } from 'react'
import useToast from '../feedback/useToast'
import useConfirmacaoComFalta from '../pedido/useConfirmacaoComFalta'
import { contarSemFichaTecnica, textoSemFichaTecnica } from '../pedido/viabilidadeUtils'
import { buscarPedido } from '../../services/pedidos'
import DialogoPedido from './DialogoPedido'
import { mensagemErro } from './fluxoPedido'
import { montarOperacoes } from './itensEdicao'
import { codigoPedido } from './pedidoUtils'

function linhaInicial(item) {
  return {
    idProdutoPedido: item.idProdutoPedido,
    fkProduto: item.fkProduto,
    quantidade: String(Number(item.quantidade)),
    valorUnitario: item.valorUnitario,
    observacao: item.observacao,
  }
}

export default function EditarItensPedido({ pedido, itens, produtos, onFechar, onItensSalvos, onPedidoAtualizado }) {
  const toast = useToast()
  const { executar, dialogo } = useConfirmacaoComFalta()
  const [linhas, setLinhas] = useState(() => itens.map(linhaInicial))
  const [novoProduto, setNovoProduto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function nomeProduto(id) {
    return produtos.find((produto) => Number(produto.idProduto) === Number(id))?.nome || 'Produto removido'
  }

  function alterarQuantidade(indice, quantidade) {
    setLinhas((atuais) => atuais.map((linha, posicao) => (posicao === indice ? { ...linha, quantidade } : linha)))
  }

  function remover(indice) {
    setLinhas((atuais) => atuais.filter((_, posicao) => posicao !== indice))
  }

  function adicionar() {
    const produto = produtos.find((item) => Number(item.idProduto) === Number(novoProduto))
    if (!produto) return
    setLinhas((atuais) => [...atuais, { fkProduto: produto.idProduto, quantidade: '1', valorUnitario: produto.precoAtual, observacao: null }])
    setNovoProduto('')
  }

  async function salvar(event) {
    event.preventDefault()
    if (enviando) return
    if (linhas.some((linha) => !(Number(linha.quantidade) > 0))) {
      setErro('Informe uma quantidade maior que zero em cada item.')
      return
    }
    setErro('')
    setEnviando(true)
    const operacoes = montarOperacoes(itens, linhas, pedido.idPedido, nomeProduto)
    let lista = itens
    let comFalta = false
    let interrompido = false
    for (let indice = 0; indice < operacoes.length; indice++) {
      const operacao = operacoes[indice]
      try {
        let salvo
        if (comFalta || !operacao.verifica) {
          salvo = await operacao.executar(comFalta)
        } else {
          const resultado = await executar(operacao.executar, { mensagemSucesso: 'Item salvo com falta de insumo.' })
          if (resultado.cancelado) {
            toast.erro(`Itens não salvos: ${operacoes.slice(indice).map((item) => item.descricao).join(', ')}.`)
            interrompido = true
            break
          }
          // After the owner's override, the remaining items go out with the same decision.
          comFalta = resultado.comFalta
          salvo = resultado.dados
        }
        lista = operacao.aplicar(lista, salvo)
      } catch (falha) {
        toast.erro(`${mensagemErro(falha)} Itens não salvos: ${operacoes.slice(indice).map((item) => item.descricao).join(', ')}.`)
        interrompido = true
        break
      }
    }
    onItensSalvos(lista)
    try {
      onPedidoAtualizado(await buscarPedido(pedido.idPedido))
    } catch {
      // The item changes already landed; the order flags refresh on the next list load.
    }
    setEnviando(false)
    if (interrompido) return
    const semFicha = contarSemFichaTecnica(lista)
    toast.sucesso(`Itens do pedido ${codigoPedido(pedido.idPedido)} salvos.${semFicha ? ` ${textoSemFichaTecnica(semFicha)}` : ''}`)
    onFechar()
  }

  const rodape = (
    <>
      <button type="button" className="order-action" disabled={enviando} onClick={onFechar}>Voltar</button>
      <button type="submit" form="form-editar-itens" className="order-action order-action-primary" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Salvar itens'}
      </button>
    </>
  )

  return (
    <DialogoPedido titulo={`Itens do pedido ${codigoPedido(pedido.idPedido)}`} ocupado={enviando} onFechar={onFechar} rodape={rodape}>
      <form id="form-editar-itens" className="pedido-form" onSubmit={salvar} noValidate>
        {linhas.length ? (
          <ul className="pedido-itens">
            {linhas.map((linha, indice) => (
              <li key={linha.idProdutoPedido ?? `novo-${indice}`}>
                <label>
                  {`Quantidade de ${nomeProduto(linha.fkProduto)}`}
                  <input type="number" min="0" step="any" value={linha.quantidade} onChange={(evento) => alterarQuantidade(indice, evento.target.value)} />
                </label>
                <button type="button" className="order-action" onClick={() => remover(indice)}>{`Remover ${nomeProduto(linha.fkProduto)}`}</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pedido-vazio">Nenhum item neste pedido.</p>
        )}
        <label>
          Adicionar produto
          <select value={novoProduto} onChange={(evento) => setNovoProduto(evento.target.value)}>
            <option value="">Selecione</option>
            {produtos.map((produto) => <option key={produto.idProduto} value={produto.idProduto}>{produto.nome}</option>)}
          </select>
        </label>
        <button type="button" className="order-action" disabled={!novoProduto} onClick={adicionar}>Adicionar item</button>
        {erro && <p className="pedido-campo-erro" role="alert">{erro}</p>}
      </form>
      {dialogo}
    </DialogoPedido>
  )
}
