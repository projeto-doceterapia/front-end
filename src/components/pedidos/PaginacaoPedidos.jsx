import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginacaoPedidos({ totalItens, porPagina, pagina, aoMudar }) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / porPagina))
  const inicio = totalItens ? (pagina - 1) * porPagina + 1 : 0
  const fim = Math.min(pagina * porPagina, totalItens)

  return (
    <nav className="orders-pagination" aria-label="Paginação dos pedidos">
      <span>{inicio}-{fim} de {totalItens} pedidos</span>
      <div>
        <button type="button" onClick={() => aoMudar(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
          <ChevronLeft size={16} />
        </button>
        <span>Página {pagina} de {totalPaginas}</span>
        <button type="button" onClick={() => aoMudar(pagina + 1)} disabled={pagina >= totalPaginas} aria-label="Próxima página">
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}