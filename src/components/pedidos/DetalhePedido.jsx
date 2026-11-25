import useSessao from '../sessao/useSessao'
import AcaoAvancarFase from './AcaoAvancarFase'
import DialogoPedido from './DialogoPedido'
import PagamentoPedido from './PagamentoPedido'
import { podeCancelar } from './fluxoPedido'
import { codigoPedido, dinheiro, formatarData, nomeCliente, textoStatus } from './pedidoUtils'

const FORMA_ENTREGA = { ENTREGA: 'Entrega', RETIRADA: 'Retirada' }

export default function DetalhePedido({ pedido, clientes, itens, produtos, pagamento, onFechar, onPedidoAtualizado, onEditar, onCancelar }) {
  const { ehDona } = useSessao()
  const status = pedido.statusPedido
  const finalizado = !podeCancelar(status)
  const itensPedido = itens.filter((item) => Number(item.fkPedido) === Number(pedido.idPedido))

  const rodape = !finalizado && (
    <>
      {ehDona && <button type="button" className="order-action order-action-texto-perigo" onClick={onCancelar}>Cancelar pedido</button>}
      <div className="pedido-dialogo-acoes">
        <button type="button" className="order-action" onClick={onEditar}>Editar pedido</button>
        <AcaoAvancarFase pedido={pedido} onPedidoAtualizado={onPedidoAtualizado} />
      </div>
    </>
  )

  return (
    <DialogoPedido titulo={`Pedido ${codigoPedido(pedido.idPedido)}`} subtitulo={nomeCliente(pedido, clientes)} onFechar={onFechar} rodape={rodape}>
      <section className="pedido-secao" aria-label="Fase">
        <h3>Fase</h3>
        <span className={`order-status status-${String(status || '').toLowerCase()}`}>{textoStatus(status)}</span>
        {status === 'AGUARDANDO_SINAL' && <p className="pedido-aviso">O pedido avança para a produção quando o sinal for registrado.</p>}
      </section>
      <section className="pedido-secao" aria-label="Dados do pedido">
        <h3>Dados</h3>
        <dl className="pedido-dados">
          <div><dt>Entrega</dt><dd>{formatarData(pedido.dataEntrega)} · {FORMA_ENTREGA[pedido.formaEntrega] || 'Forma não informada'}</dd></div>
          {pedido.formaEntrega === 'ENTREGA' && <div><dt>Endereço</dt><dd>{pedido.enderecoEntrega || 'Não informado'}</dd></div>}
          <div><dt>Anotação</dt><dd>{pedido.anotacao || 'Sem anotação'}</dd></div>
        </dl>
      </section>
      <section className="pedido-secao" aria-label="Itens">
        <h3>Itens</h3>
        {itensPedido.length ? (
          <ul className="pedido-itens">
            {itensPedido.map((item) => (
              <li key={item.idProdutoPedido}>
                <span>{produtos.find((produto) => Number(produto.idProduto) === Number(item.fkProduto))?.nome || 'Produto removido'} ×{Number(item.quantidade || 1)}</span>
                {ehDona && <strong>{dinheiro(item.valorTotal)}</strong>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pedido-vazio">Nenhum item neste pedido.</p>
        )}
      </section>
      {ehDona && <PagamentoPedido pagamento={pagamento} />}
    </DialogoPedido>
  )
}
