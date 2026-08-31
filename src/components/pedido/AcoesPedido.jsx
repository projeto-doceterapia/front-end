export default function AcoesPedido({ etapa, aoVoltar, aoAvancar }) {
  return (
    <footer className="order-actions">
      <button className="outline-button" onClick={aoVoltar}>← Voltar</button>

      {etapa === 2 && (
        <button className="primary-button" onClick={aoAvancar}>Próximo → Pagamento</button>
      )}
    </footer>
  )
}
