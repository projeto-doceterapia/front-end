function EstoqueAtencao() {
  const estoque = [
    ['Açúcar Refinado', '3 kg', '5 kg'],
    ['Manteiga', '2 kg', '3 kg'],
    ['Nescau', '2 unidades', '3 unidades'],
  ]

  return (
    <section className="painel">
      <div className="titulo"><h2>⚠ Estoque em atenção</h2><a>Ver estoque completo →</a></div>
      <div className="estoque">
        {estoque.map((item) => (
          <div className="item-estoque" key={item[0]}>
            <span>◉</span><b>{item[0]}<em>Baixo</em></b>
            <p>Atual: <strong>{item[1]}</strong><small>Mínimo: {item[2]}</small></p>
            <div className="progresso"><i></i></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default EstoqueAtencao
