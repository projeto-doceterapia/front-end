import { Check } from 'lucide-react'

export default function ResumoPedido({ itens, total, dinheiro, cliente, dados, aoConfirmar, salvando }) {
  return (
    <section className="summary-panel order-panel">
      <header><span className="panel-icon">$</span><h2>Resumo do pedido</h2></header>
      <div className="summary-body">
        <small>Cliente</small><p>{cliente?.nome || 'Nao selecionado'}</p>
        <small>Entrega</small><p>{dados.formaEntrega === 'ENTREGA' ? dados.enderecoEntrega : 'Retirada'}</p>
        <small>Data</small><p>{formatarData(dados.dataEntrega)}</p>
        <hr /><small>Itens</small>
        {itens.map((item) => <p className="summary-item" key={item.produto.idProduto}>{item.produto.nome} x {item.quantidade}<b>{dinheiro(Number(item.produto.precoAtual) * item.quantidade)}</b></p>)}
        <hr /><p className="summary-total">Valor total <b>{dinheiro(total)}</b></p>
        <button className="primary-button confirm" onClick={aoConfirmar} disabled={salvando}><Check size={16} />{salvando ? 'Salvando...' : 'Salvar orcamento'}</button>
      </div>
    </section>
  )
}

function formatarData(data) {
  if (!data) return 'Data nao informada'
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}
