import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import logoRelatorio from '../../assets/logo-relatorio.png'
import { NOME_NEGOCIO, SLOGAN } from '../identidade'
import { unidades } from '../estoque/estoqueUtils'
import { buscarFinanceiros, buscarOperacionais } from '../../services/indicadores'
import { mesAtual, validarPeriodo } from './periodoUtils'
import {
  RESSALVA_LUCRO,
  contarPedidos,
  formatarDataBr,
  formatarDinheiro,
  formatarGeracao,
  linhasDePedidos,
  mensagemErroRelatorio,
  percentualDaBarra,
  topCinco,
} from './relatorioUtils'
import SecaoRelatorio from './SecaoRelatorio'
import '../../styles/relatorio.css'

export default function RelatorioVisaoGeral({ onBack }) {
  const [rascunho, setRascunho] = useState(() => mesAtual(new Date()))
  const [periodo, setPeriodo] = useState(rascunho)
  const [tentativa, setTentativa] = useState(0)
  const [estado, setEstado] = useState({ carregando: true, erro: null, operacionais: null, financeiros: null, geradoEm: null })
  const titulo = useRef(null)
  const avisoPeriodo = validarPeriodo(rascunho.de, rascunho.ate)

  useEffect(() => { titulo.current?.focus() }, [])

  useEffect(() => {
    let ativo = true
    Promise.all([buscarOperacionais(periodo), buscarFinanceiros(periodo)])
      .then(([operacionais, financeiros]) => {
        if (ativo) setEstado({ carregando: false, erro: null, operacionais, financeiros, geradoEm: new Date() })
      })
      .catch((erro) => {
        if (ativo) setEstado({ carregando: false, erro: mensagemErroRelatorio(erro), operacionais: null, financeiros: null, geradoEm: null })
      })
    return () => { ativo = false }
  }, [periodo, tentativa])

  function recarregar() {
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }))
    setTentativa((valor) => valor + 1)
  }

  function atualizar() {
    if (avisoPeriodo) return
    setPeriodo(rascunho)
    recarregar()
  }

  const { carregando, erro, operacionais, financeiros, geradoEm } = estado
  const pronto = !carregando && !erro && operacionais && financeiros
  const semPedidos = pronto && contarPedidos(operacionais.pedidosPorStatus) + financeiros.cancelados.quantidade === 0

  return (
    <main className="relatorio" aria-busy={carregando}>
      <div className="relatorio-acoes">
        <button type="button" className="relatorio-voltar" onClick={onBack}>Voltar à Visão Geral</button>
        <div className="relatorio-periodo">
          <label htmlFor="relatorio-de">De</label>
          <input id="relatorio-de" type="date" value={rascunho.de}
            onChange={(evento) => setRascunho({ ...rascunho, de: evento.target.value })} />
          <label htmlFor="relatorio-ate">Até</label>
          <input id="relatorio-ate" type="date" value={rascunho.ate}
            onChange={(evento) => setRascunho({ ...rascunho, ate: evento.target.value })} />
          <button type="button" onClick={atualizar}>Atualizar</button>
        </div>
        <button type="button" className="relatorio-imprimir" disabled={carregando || Boolean(erro) || Boolean(avisoPeriodo)}
          onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Imprimir ou salvar PDF
        </button>
        {avisoPeriodo && <p className="relatorio-aviso" role="alert">{avisoPeriodo}</p>}
      </div>

      <header className="relatorio-cabecalho">
        <div>
          <h1 ref={titulo} tabIndex={-1}>Relatório do período</h1>
          <p className="relatorio-negocio">{NOME_NEGOCIO}</p>
          <p className="relatorio-slogan">{SLOGAN}</p>
          <p>Período: {formatarDataBr(periodo.de)} a {formatarDataBr(periodo.ate)}</p>
          {pronto && <p>Gerado em {formatarGeracao(geradoEm)}</p>}
          {semPedidos && <p>Nenhum pedido com entrega no período.</p>}
        </div>
        <img src={logoRelatorio} alt="Logo Doceterapia" className="relatorio-logo" />
      </header>

      {carregando && <p className="relatorio-estado" role="status">Gerando relatório...</p>}
      {erro && (
        <div className="relatorio-estado relatorio-erro" role="alert">
          <p>{erro}</p>
          <button type="button" onClick={recarregar}>Tentar novamente</button>
        </div>
      )}
      {pronto && <CorpoRelatorio operacionais={operacionais} financeiros={financeiros} geradoEm={geradoEm} />}
    </main>
  )
}

function CorpoRelatorio({ operacionais, financeiros, geradoEm }) {
  const { faturamento, cancelados, emOrcamento } = financeiros
  const porQuantidade = topCinco(operacionais.produtosMaisVendidos)
  const porFaturamento = topCinco(financeiros.produtosMaisVendidosPorFaturamento)
  const insumos = operacionais.insumosAbaixoDoMinimo

  return (
    <>
      <SecaoRelatorio id="relatorio-faturamento" titulo="Faturamento">
        <dl className="relatorio-valores">
          <div><dt>Recebido</dt><dd>{formatarDinheiro(faturamento.recebido)}</dd></div>
          <div><dt>A receber</dt><dd>{formatarDinheiro(faturamento.aReceber)}</dd></div>
          <div><dt>Total</dt><dd>{formatarDinheiro(faturamento.total)}</dd></div>
          <div><dt>Ticket médio</dt><dd>{formatarDinheiro(financeiros.ticketMedio)}</dd></div>
        </dl>
        <p className="relatorio-nota">Pedidos não cancelados com entrega no período.</p>
      </SecaoRelatorio>

      <SecaoRelatorio id="relatorio-pedidos" titulo="Pedidos">
        <table className="relatorio-tabela">
          <thead><tr><th scope="col">Status</th><th scope="col">Pedidos</th></tr></thead>
          <tbody>
            {linhasDePedidos(operacionais.pedidosPorStatus).map((linha) => (
              <tr key={linha.status}><td>{linha.rotulo}</td><td>{linha.quantidade}</td></tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">Total</th><td>{contarPedidos(operacionais.pedidosPorStatus)}</td></tr></tfoot>
        </table>
        <p className="relatorio-nota">Em orçamento: {emOrcamento.quantidade} pedidos, {formatarDinheiro(emOrcamento.valor)} (fora do faturamento).</p>
        <div className="relatorio-cancelados">
          <h3>Cancelados</h3>
          <dl className="relatorio-valores">
            <div><dt>Quantidade</dt><dd>{cancelados.quantidade}</dd></div>
            <div><dt>Pago</dt><dd>{formatarDinheiro(cancelados.pago)}</dd></div>
            <div><dt>Devolvido</dt><dd>{formatarDinheiro(cancelados.devolvido)}</dd></div>
            <div><dt>Retido</dt><dd>{formatarDinheiro(cancelados.retido)}</dd></div>
          </dl>
          <p className="relatorio-nota">Fora do faturamento.</p>
        </div>
      </SecaoRelatorio>

      <SecaoRelatorio id="relatorio-produtos" titulo="Produtos mais vendidos">
        <div className="relatorio-colunas">
          <ListaProdutos titulo="Por quantidade" itens={porQuantidade}
            valorDe={(item) => item.quantidade} textoDe={(item) => `${item.quantidade} un.`} />
          <ListaProdutos titulo="Por faturamento" itens={porFaturamento}
            valorDe={(item) => item.valor} textoDe={(item) => formatarDinheiro(item.valor)} />
        </div>
      </SecaoRelatorio>

      <SecaoRelatorio id="relatorio-gastos" titulo="Gastos com insumos">
        <p className="relatorio-destaque">Compras lançadas no período: <strong>{formatarDinheiro(financeiros.gastosInsumos)}</strong></p>
      </SecaoRelatorio>

      <SecaoRelatorio id="relatorio-lucro" titulo="Lucro estimado">
        <p className="relatorio-destaque"><strong>{formatarDinheiro(financeiros.lucroEstimado)}</strong></p>
        <p className="relatorio-ressalva">{RESSALVA_LUCRO}</p>
      </SecaoRelatorio>

      <SecaoRelatorio id="relatorio-estoque" titulo={`Insumos abaixo do mínimo (saldo em ${geradoEm.toLocaleDateString('pt-BR')})`}>
        {insumos.length === 0 ? <p>Nenhum insumo abaixo do mínimo.</p> : (
          <table className="relatorio-tabela">
            <thead><tr><th scope="col">Insumo</th><th scope="col">Saldo</th><th scope="col">Mínimo</th><th scope="col">Unidade</th></tr></thead>
            <tbody>
              {insumos.map((insumo) => (
                <tr key={insumo.insumoId}>
                  <td>{insumo.nome}</td><td>{Number(insumo.saldo)}</td><td>{Number(insumo.minimo)}</td><td>{unidades[insumo.unidade] ?? insumo.unidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SecaoRelatorio>
    </>
  )
}

function ListaProdutos({ titulo, itens, valorDe, textoDe }) {
  const maior = Math.max(0, ...itens.map((item) => Number(valorDe(item))))
  return (
    <div>
      <h3>{titulo}</h3>
      {itens.length === 0 ? <p>Nenhum produto vendido no período.</p> : (
        <ol className="relatorio-ranking">
          {itens.map((item) => (
            <li key={item.produtoId}>
              <span className="relatorio-produto">{item.nome}</span>
              <span className="relatorio-produto-valor">{textoDe(item)}</span>
              <span className="relatorio-trilha" aria-hidden="true">
                <span className="relatorio-barra" style={{ width: `${percentualDaBarra(valorDe(item), maior)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
