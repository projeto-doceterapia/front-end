import { ROTULOS_NIVEL, nivelEstoque, unidades } from '../estoque/estoqueUtils'
import { numero } from '../formatos'

export default function EstoqueAtencao({ insumos }) {
  return (
    <section className="painel">
      <div className="titulo"><h2>Estoque em atenção</h2><a>Itens abaixo do mínimo</a></div>
      <div className="estoque">
        {insumos.map((item) => {
          const unidade = unidades[item.unidade] ?? item.unidade
          const { status, percentual } = nivelEstoque({ quantidadeAtual: item.saldo, quantidadeMinima: item.minimo })
          return <div className={`item-estoque nivel-${status}`} key={item.insumoId}>
            <span aria-hidden="true">!</span><b>{item.nome}<em>{ROTULOS_NIVEL[status]}</em></b>
            <p>Atual: <strong>{numero(item.saldo)} {unidade}</strong><small>Mínimo: {numero(item.minimo)} {unidade}</small></p>
            <div className="progresso"><i style={{ width: `${percentual}%` }} /></div>
          </div>
        })}
        {!insumos.length && <p className="empty-dashboard">Nenhum item está abaixo do estoque mínimo.</p>}
      </div>
    </section>
  )
}
