import { useEffect, useRef, useState } from 'react'
import useToast from '../feedback/useToast'
import { buscarPagamentoDoPedido, registrarRestante, registrarSinal } from '../../services/pagamentos'
import { mensagemErro } from './fluxoPedido'
import { dinheiro, FORMA_PAGAMENTO, formatarDataCompleta, textoStatusPagamento } from './pedidoUtils'

const PARCELAS = {
  sinal: {
    titulo: 'Sinal',
    registrar: registrarSinal,
    sucesso: 'Sinal registrado. Pedido aguardando produção.',
  },
  restante: {
    titulo: 'Restante',
    registrar: registrarRestante,
    sucesso: 'Restante registrado. Pedido pago integralmente.',
  },
}

function hoje() {
  const agora = new Date()
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
}

function situacaoParcela(forma, data) {
  if (!data) return 'Pendente'
  return `Pago em ${formatarDataCompleta(data)} via ${FORMA_PAGAMENTO[forma] || forma || 'forma não informada'}`
}

function FormularioParcela({ parcela, pagamento, onRegistrado }) {
  const toast = useToast()
  const [formaPagamento, setFormaPagamento] = useState('')
  const [dataPagamento, setDataPagamento] = useState('')
  const [enviando, setEnviando] = useState(false)
  // State updates land after the next click event, so a ref blocks the double submit synchronously.
  const emCurso = useRef(false)
  const { titulo, registrar, sucesso } = PARCELAS[parcela]
  const idCampo = `pagamento-${pagamento.idPagamento}-${parcela}`

  async function enviar(evento) {
    evento.preventDefault()
    if (!formaPagamento || emCurso.current) return
    emCurso.current = true
    setEnviando(true)
    try {
      const atualizado = await registrar(pagamento.idPagamento, { formaPagamento, dataPagamento })
      toast.sucesso(sucesso)
      onRegistrado(atualizado)
    } catch (erro) {
      toast.erro(mensagemErro(erro, 'Não foi possível registrar o pagamento. Tente novamente.'))
    } finally {
      emCurso.current = false
      setEnviando(false)
    }
  }

  return (
    <form className="pedido-form pagamento-registro" onSubmit={enviar}>
      <fieldset>
        <legend>{titulo}</legend>
        <label htmlFor={`${idCampo}-forma`}>Forma de pagamento do {titulo.toLowerCase()}</label>
        <select id={`${idCampo}-forma`} value={formaPagamento} onChange={(evento) => setFormaPagamento(evento.target.value)} required>
          <option value="">Selecione</option>
          {Object.entries(FORMA_PAGAMENTO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
        <label htmlFor={`${idCampo}-data`}>Data do recebimento (opcional, padrão hoje)</label>
        <input id={`${idCampo}-data`} type="date" max={hoje()} value={dataPagamento} onChange={(evento) => setDataPagamento(evento.target.value)} />
        <button type="submit" className="order-action order-action-primary" disabled={!formaPagamento || enviando} aria-busy={enviando}>
          {enviando ? 'Registrando...' : `Registrar ${titulo.toLowerCase()}`}
        </button>
      </fieldset>
    </form>
  )
}

function proximaParcela(pagamento, statusPedido) {
  if (statusPedido === 'CANCELADO') return null
  if (!pagamento.dataPagamentoSinal) return statusPedido === 'AGUARDANDO_SINAL' ? 'sinal' : null
  return pagamento.dataPagamentoRestante ? null : 'restante'
}

export default function PagamentoPedido({ pedido, pagamento: pagamentoInicial, onPedidoAtualizado }) {
  const [pagamento, setPagamento] = useState(pagamentoInicial || null)
  const [carga, setCarga] = useState(pagamentoInicial ? 'pronto' : 'carregando')
  const [tentativa, setTentativa] = useState(0)
  const statusPedido = pedido.statusPedido

  useEffect(() => {
    if (pagamentoInicial) return undefined
    let ativo = true
    buscarPagamentoDoPedido(pedido.idPedido)
      .then((resposta) => {
        if (!ativo) return
        setPagamento(resposta)
        setCarga('pronto')
      })
      .catch((erro) => {
        if (ativo) setCarga(erro?.response?.status === 404 ? 'sem-pagamento' : 'erro')
      })
    return () => {
      ativo = false
    }
  }, [pagamentoInicial, pedido.idPedido, tentativa])

  function tentarNovamente() {
    setCarga('carregando')
    setTentativa((atual) => atual + 1)
  }

  function registrado(atualizado) {
    const sinalRegistrado = !pagamento.dataPagamentoSinal && atualizado.dataPagamentoSinal
    setPagamento(atualizado)
    // The server moves the order to production in the same transaction as the deposit.
    if (sinalRegistrado && statusPedido === 'AGUARDANDO_SINAL') onPedidoAtualizado({ idPedido: pedido.idPedido, statusPedido: 'ESPERANDO_FAZER' })
  }

  let conteudo
  if (carga === 'carregando') conteudo = <p role="status">Carregando pagamento...</p>
  else if (carga === 'sem-pagamento') conteudo = <p className="pedido-vazio">O pagamento é criado quando o pedido é confirmado.</p>
  else if (carga === 'erro') {
    conteudo = (
      <div role="alert" className="pedido-vazio">
        <p>Não foi possível carregar o pagamento.</p>
        <button type="button" className="order-action" onClick={tentarNovamente}>Tentar novamente</button>
      </div>
    )
  } else {
    const parcela = proximaParcela(pagamento, statusPedido)
    const aReceber = statusPedido === 'ENTREGUE' && parcela === 'restante'
    conteudo = (
      <>
        <dl className="pedido-dados">
          <div><dt>Situação</dt><dd>{textoStatusPagamento(pagamento.statusPagamento)}</dd></div>
          <div><dt>Total</dt><dd>{dinheiro(pagamento.valorTotal)}</dd></div>
          <div><dt>Sinal (50%)</dt><dd>{dinheiro(pagamento.valorSinal)} · {situacaoParcela(pagamento.formaPagamentoSinal, pagamento.dataPagamentoSinal)}</dd></div>
          <div><dt>Restante</dt><dd>{dinheiro(pagamento.valorRestante)} · {situacaoParcela(pagamento.formaPagamentoRestante, pagamento.dataPagamentoRestante)}</dd></div>
        </dl>
        {aReceber && <p className="pedido-aviso pagamento-a-receber">A receber: {dinheiro(pagamento.valorRestante)}</p>}
        {parcela === 'sinal' && <p className="pedido-aviso">Registre o sinal antes do restante.</p>}
        {parcela && <FormularioParcela key={parcela} parcela={parcela} pagamento={pagamento} onRegistrado={registrado} />}
      </>
    )
  }

  return (
    <section className="pedido-secao" aria-label="Pagamento">
      <h3>Pagamento</h3>
      {conteudo}
    </section>
  )
}
