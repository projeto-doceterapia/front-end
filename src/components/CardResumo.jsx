function CardResumo(props) {
  return (
    <article className={`card ${props.cor}`}>
      <span className="icone">{props.icone}</span>
      <p>{props.titulo}</p>
      <strong>{props.valor}</strong>
      <small>{props.detalhe}</small>
    </article>
  )
}

export default CardResumo
