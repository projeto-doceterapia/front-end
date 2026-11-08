import { unidades } from '../estoque/estoqueUtils'

export default function EstoqueAtencao({ insumos }) {
  return (
    <section className="painel">
      <div className="titulo"><h2>Estoque em atenção</h2><a>Itens abaixo do mínimo</a></div>
      <div className="estoque">
        {insumos.map((item) => {
          const unidade = unidades[item.unidade] ?? item.unidade
          const percentual = Number(item.minimo) ? Math.min(100, (Number(item.saldo) / Number(item.minimo)) * 100) : 0
          return <div className="item-estoque" key={item.insumoId}>
            <span>!</span><b>{item.nome}<em>Baixo</em></b>
            <p>Atual: <strong>{Number(item.saldo)} {unidade}</strong><small>Mínimo: {Number(item.minimo)} {unidade}</small></p>
            <div className="progresso"><i style={{ width: `${percentual}%` }} /></div>
          </div>
        })}
        {!insumos.length && <p className="empty-dashboard">Nenhum item está abaixo do estoque mínimo.</p>}
      </div>
    </section>
  )
}
