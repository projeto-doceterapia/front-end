import { dinheiro, FORMA_PAGAMENTO, formatarData, textoStatusPagamento } from './pedidoUtils'

function linhaParcela(titulo, valor, forma, data) {
  const situacao = data ? `${FORMA_PAGAMENTO[forma] || forma || 'Forma não informada'} em ${formatarData(data)}` : 'Pendente'
  return (
    <div>
      <dt>{titulo}</dt>
      <dd>{dinheiro(valor)} · {situacao}</dd>
    </div>
  )
}

export default function PagamentoPedido({ pagamento }) {
  return (
    <section className="pedido-secao" aria-label="Pagamento">
      <h3>Pagamento</h3>
      {pagamento ? (
        <dl className="pedido-dados">
          <div><dt>Situação</dt><dd>{textoStatusPagamento(pagamento.statusPagamento)}</dd></div>
          <div><dt>Total</dt><dd>{dinheiro(pagamento.valorTotal)}</dd></div>
          {linhaParcela('Sinal', pagamento.valorSinal, pagamento.formaPagamentoSinal, pagamento.dataPagamentoSinal)}
          {linhaParcela('Restante', pagamento.valorRestante, pagamento.formaPagamentoRestante, pagamento.dataPagamentoRestante)}
        </dl>
      ) : (
        <p className="pedido-vazio">Nenhum pagamento gerado para este pedido.</p>
      )}
    </section>
  )
}
