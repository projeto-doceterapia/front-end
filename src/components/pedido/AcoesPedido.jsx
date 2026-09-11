export default function AcoesPedido({ etapa, aoVoltar, aoAvancar }) {
  const proximoTexto = etapa === 1 ? 'Proximo - Itens' : 'Proximo - Pagamento'

  return (
    <footer className="order-actions">
      <button className="outline-button" onClick={aoVoltar}>Voltar</button>
      {etapa < 3 && <button className="primary-button" onClick={aoAvancar}>{proximoTexto}</button>}
    </footer>
  )
}
