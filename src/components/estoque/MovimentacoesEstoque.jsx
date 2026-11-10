import { useEffect, useState } from 'react'
import Filtros from '../visao-geral/Filtros'
import { ultimosDias } from '../visao-geral/periodoUtils'
import { buscarMovimentacoes } from '../../services/movimentacoes'
import { unidades } from './estoqueUtils'

const TIPOS = {
  SALDO_INICIAL: 'Saldo inicial',
  ENTRADA_COMPRA: 'Entrada de compra',
  AJUSTE: 'Ajuste',
  SAIDA_PRODUCAO: 'Saída para produção',
}

export default function MovimentacoesEstoque({ insumos }) {
  const [periodo, setPeriodo] = useState(() => ultimosDias(new Date(), 30))
  const [insumoId, setInsumoId] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [estado, setEstado] = useState({ carregando: true, erro: false, movimentos: [] })

  useEffect(() => {
    let ativo = true
    buscarMovimentacoes({ ...periodo, insumoId })
      .then((movimentos) => { if (ativo) setEstado({ carregando: false, erro: false, movimentos: movimentos || [] }) })
      .catch(() => { if (ativo) setEstado({ carregando: false, erro: true, movimentos: [] }) })
    return () => { ativo = false }
  }, [periodo, insumoId, tentativa])

  function recarregar(alteracao) {
    setEstado((atual) => ({ ...atual, carregando: true, erro: false }))
    alteracao()
  }

  const { carregando, erro, movimentos } = estado
  const nomes = new Map(insumos.map((insumo) => [insumo.idInsumo, insumo]))

  return (
    <section className="stock-panel stock-movements" aria-label="Movimentações de estoque" aria-busy={carregando}>
      <div className="stock-movements-toolbar">
        <h2>Movimentações</h2>
        <Filtros idPrefixo="movimentos" de={periodo.de} ate={periodo.ate}
          onChange={(novo) => recarregar(() => setPeriodo(novo))} />
        <label>Insumo{' '}
          <select value={insumoId} onChange={(evento) => recarregar(() => setInsumoId(evento.target.value))}>
            <option value="">Todos os insumos</option>
            {insumos.map((insumo) => <option key={insumo.idInsumo} value={insumo.idInsumo}>{insumo.nome}</option>)}
          </select>
        </label>
      </div>
      {!carregando && !erro && movimentos.length > 0 && (
        <div className="stock-table-scroll"><table className="stock-table">
          <thead><tr><th>Data</th><th>Insumo</th><th>Tipo</th><th>Quantidade</th></tr></thead>
          <tbody>{movimentos.map((movimento) => {
            const insumo = nomes.get(movimento.insumoId)
            return <tr key={movimento.idMovimentacao}>
              <td>{new Date(movimento.ocorridoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{insumo?.nome ?? `Insumo ${movimento.insumoId}`}</td>
              <td>{TIPOS[movimento.tipo] ?? movimento.tipo}</td>
              <td>{Number(movimento.quantidade)} {unidades[insumo?.unidade] ?? ''}</td>
            </tr>
          })}</tbody>
        </table></div>
      )}
      {carregando && <p className="stock-empty" role="status">Carregando movimentações...</p>}
      {erro && <div className="stock-empty" role="alert"><p>Não foi possível carregar as movimentações.</p><button type="button" className="stock-secondary" onClick={() => recarregar(() => setTentativa((valor) => valor + 1))}>Tentar novamente</button></div>}
      {!carregando && !erro && !movimentos.length && <p className="stock-empty">Nenhuma movimentação neste período.</p>}
    </section>
  )
}
