export default function SecaoRelatorio({ id, titulo, children }) {
  return (
    <section className="relatorio-secao" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
    </section>
  )
}
