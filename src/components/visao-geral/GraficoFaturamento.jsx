export default function GraficoFaturamento({ faturamentoPorMes }) {
  const maior = Math.max(...faturamentoPorMes.map((item) => Number(item.total)), 1)
  const eixosY = Array.from({ length: 5 }, (_, indice) => maior * (4 - indice) / 4)

  return (
    <section className="painel grafico-faturamento">
      <div className="titulo"><div><h2>Faturamento mensal</h2><p>Últimos 6 meses até o fim do período, pela data de entrega</p></div></div>
      <div className="linhas">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
          <g className="eixo-y">
            {eixosY.map((valor) => <g key={valor}><line x1="36" x2="980" y1={posicaoY(valor, maior)} y2={posicaoY(valor, maior)} /><text x="18" y={posicaoY(valor, maior) + 4}>{formatarDinheiro(valor)}</text></g>)}
          </g>
          <polyline className="faturamento" points={faturamentoPorMes.map((item, indice) => `${posicaoX(indice, faturamentoPorMes.length)},${posicaoY(Number(item.total), maior)}`).join(' ')} />
          {faturamentoPorMes.map((item, indice) => <circle className="ponto faturamento" cx={posicaoX(indice, faturamentoPorMes.length)} cy={posicaoY(Number(item.total), maior)} r="4" key={item.mes}><title>{`Faturamento: ${formatarDinheiro(item.total)}`}</title></circle>)}
        </svg>
        <div className="meses-grafico">{faturamentoPorMes.map((item) => <span key={item.mes}>{rotuloMes(item.mes)}</span>)}</div>
        <div className="legenda-linhas"><span className="faturamento">Faturamento</span></div>
      </div>
    </section>
  )
}

function rotuloMes(mes) {
  const [ano, numero] = mes.split('-').map(Number)
  return new Date(ano, numero - 1, 1).toLocaleDateString('pt-BR', { month: 'short' })
}

function posicaoX(indice, total) { return total === 1 ? 500 : 40 + indice * (920 / (total - 1)) }
function posicaoY(valor, maior) { return 180 - (valor / maior) * 150 }
function formatarDinheiro(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(valor || 0))
}
