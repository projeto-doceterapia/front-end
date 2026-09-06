export default function CabecalhoPedido({ etapa }) {
  const pagamentoAtivo = etapa === 3

  return (
    <>
      <div className="breadcrumb">
        Pedidos <span>›</span> Registrar Pedido
        {pagamentoAtivo && <><span>›</span> Pagamento e resumo</>}
      </div>
      <h1>{pagamentoAtivo ? 'Pagamento e resumo' : 'Registrar Pedido'}</h1>
      <p className="page-subtitle">
        {pagamentoAtivo ? 'Revise os dados do pedido e escolha a forma de pagamento' : 'Monte o pedido ou salve um orçamento para confirmar depois'}
      </p>
    </>
  )
}
