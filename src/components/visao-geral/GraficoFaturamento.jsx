import { useState } from 'react'

export default function GraficoFaturamento({ itens, pedidos }) {
  const [periodo, setPeriodo] = useState(6)
  const meses = criarMeses(periodo)
  const dados = meses.map((mes) => calcularMes(mes, itens, pedidos))
  const maior = Math.max(...dados.flatMap((item) => [item.faturamento, item.custo, item.lucro]), 1)

  return (
    <section className="painel grafico-faturamento">
      <div className="titulo"><div><h2>Faturamento mensal x custo x lucro</h2><p>Dados dos pedidos cadastrados</p></div><div className="filtros">{[[3, 'Últimos 3 meses'], [6, 'Últimos 6 meses'], [12, 'Este ano']].map(([valor, texto]) => <button type="button" className={periodo === valor ? 'active' : ''} onClick={() => setPeriodo(valor)} key={valor}>{texto}</button>)}</div></div>
      <div className="linhas">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
          <polyline className="faturamento" points={pontos(dados.map((item) => item.faturamento), maior)} />
          <polyline className="custo" points={pontos(dados.map((item) => item.custo), maior)} />
          <polyline className="lucro" points={pontos(dados.map((item) => item.lucro), maior)} />
          {dados.map((item, indice) => <circle className="ponto faturamento" cx={posicaoX(indice, dados.length)} cy={posicaoY(item.faturamento, maior)} r="4" key={`f-${indice}`} />)}
          {dados.map((item, indice) => <circle className="ponto custo" cx={posicaoX(indice, dados.length)} cy={posicaoY(item.custo, maior)} r="4" key={`c-${indice}`} />)}
          {dados.map((item, indice) => <circle className="ponto lucro" cx={posicaoX(indice, dados.length)} cy={posicaoY(item.lucro, maior)} r="4" key={`l-${indice}`} />)}
        </svg>
        <div className="meses-grafico">{dados.map((item) => <span key={item.chave}>{item.rotulo}</span>)}</div>
        <div className="legenda-linhas"><span className="faturamento">Faturamento</span><span className="custo">Custo</span><span className="lucro">Lucro</span></div>
      </div>
    </section>
  )
}

function criarMeses(periodo) {
  const hoje = new Date()
  return Array.from({ length: periodo }, (_, indice) => new Date(hoje.getFullYear(), hoje.getMonth() - periodo + 1 + indice, 1))
}

function calcularMes(data, itens, pedidos) {
  const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
  const ids = pedidos.filter((pedido) => (pedido.dataCriacao || pedido.dataEntrega || '').startsWith(chave)).map((pedido) => pedido.idPedido)
  const itensMes = itens.filter((item) => ids.includes(item.fkPedido))
  const faturamento = itensMes.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)
  const custo = itensMes.reduce((soma, item) => soma + Number(item.custoEstimadoItem || 0), 0)
  return { chave, rotulo: data.toLocaleDateString('pt-BR', { month: 'short' }), faturamento, custo, lucro: faturamento - custo }
}

function posicaoX(indice, total) { return total === 1 ? 500 : 40 + indice * (920 / (total - 1)) }
function posicaoY(valor, maior) { return 180 - (valor / maior) * 150 }
function pontos(valores, maior) { return valores.map((valor, indice) => `${posicaoX(indice, valores.length)},${posicaoY(valor, maior)}`).join(' ') }
