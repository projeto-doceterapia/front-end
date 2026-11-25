export default function AcoesPedido({ etapa, aoVoltar, aoAvancar }) {
  const proximoTexto = etapa === 1 ? 'Continuar: escolher itens' : 'Continuar: pagamento'

  return (
    <footer className="order-actions">
      <button type="button" className="outline-button order-back" onClick={aoVoltar}>Voltar</button>
      {etapa < 3 && <button type="button" className="primary-button" onClick={aoAvancar}>{proximoTexto}</button>}
    </footer>
  )
}
