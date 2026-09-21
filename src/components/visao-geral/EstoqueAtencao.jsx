export default function EstoqueAtencao({ insumos }) {
  return (
    <section className="painel">
      <div className="titulo"><h2>Estoque em atenção</h2><a>Itens abaixo do mínimo</a></div>
      <div className="estoque">
        {insumos.map((item) => {
          const percentual = item.quantidadeMinima ? Math.min(100, (Number(item.quantidadeAtual) / Number(item.quantidadeMinima)) * 100) : 0
          return <div className="item-estoque" key={item.idInsumo}>
            <span>!</span><b>{item.nome}<em>Baixo</em></b>
            <p>Atual: <strong>{item.quantidadeAtual} {item.unidade}</strong><small>Mínimo: {item.quantidadeMinima} {item.unidade}</small></p>
            <div className="progresso"><i style={{ width: `${percentual}%` }} /></div>
          </div>
        })}
        {!insumos.length && <p className="empty-dashboard">Nenhum item está abaixo do estoque mínimo.</p>}
      </div>
    </section>
  )
}
