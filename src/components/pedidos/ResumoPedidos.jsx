export default function ResumoPedidos({ itens }) {
  return (
    <section className="orders-summary" aria-label="Resumo dos pedidos">
      {itens.map(({ titulo, valor, icone: Icone, cor }) => (
        <article className={`orders-summary-card ${cor}`} key={titulo}>
          <div className="orders-summary-label"><span><Icone size={16} /></span>{titulo}</div>
          <strong>{valor}</strong>
        </article>
      ))}
    </section>
  )
}