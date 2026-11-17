import ConfirmDialog from '../feedback/ConfirmDialog'
import useSessao from '../sessao/useSessao'
import { formatarQuantidade, quantidadeFaltante } from './viabilidadeUtils'

const AVISO_DONA = 'Se confirmar, o pedido fica marcado como confirmado com falta de insumo.'
const AVISO_FUNCIONARIA = 'Só a dona pode confirmar um pedido com falta de insumo. Reponha o estoque ou ajuste os itens.'

export default function DialogoFaltaInsumo({ aberto, mensagem, faltas, ehDona, ocupado = false, onConfirmarMesmoAssim, onFechar }) {
  const conteudo = (
    <>
      {mensagem && <p>{mensagem}</p>}
      <ul className="stock-shortage-list">
        {faltas.map((falta) => (
          <li key={falta.insumoId ?? falta.nome}>
            <strong>{falta.nome}</strong>
            {` — necessário ${formatarQuantidade(falta.necessario, falta.unidade)}, disponível ${formatarQuantidade(falta.disponivel, falta.unidade)}, faltam ${formatarQuantidade(quantidadeFaltante(falta), falta.unidade)}`}
          </li>
        ))}
      </ul>
      <p>{ehDona ? AVISO_DONA : AVISO_FUNCIONARIA}</p>
    </>
  )

  return (
    <ConfirmDialog
      aberto={aberto}
      titulo="Faltam insumos para este pedido"
      mensagem={conteudo}
      textoConfirmar="Confirmar mesmo assim"
      textoCancelar={ehDona ? 'Cancelar' : 'Fechar'}
      perigoso={ehDona}
      ocupado={ocupado}
      onConfirm={ehDona ? onConfirmarMesmoAssim : undefined}
      onCancel={onFechar}
    />
  )
}

// Reads the profile only while the dialog is shown, so callers rendered outside a session keep working.
export function DialogoFaltaInsumoDaSessao(props) {
  const { ehDona } = useSessao()
  return <DialogoFaltaInsumo {...props} aberto ehDona={ehDona} />
}
