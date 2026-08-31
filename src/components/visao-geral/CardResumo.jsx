export default function CardResumo({ cor, icone, titulo, valor, detalhe }) {
  return (
    <article className={`card ${cor}`}>
      <span className="icone">{icone}</span>
      <p>{titulo}</p>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}
