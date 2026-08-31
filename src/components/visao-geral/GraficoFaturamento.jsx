import Filtros from './Filtros'

const meses = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr']

export default function GraficoFaturamento() {
  return (
    <section className="painel grafico-faturamento">
      <div className="titulo">
        <div>
          <h2>Faturamento mensal x custo x lucro</h2>
          <p>Últimos 6 meses</p>
        </div>
        <Filtros />
      </div>

      <div className="linhas">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
          <polyline className="faturamento" points="40,58 225,132 410,96 595,62 780,32 960,42" />
          <polyline className="lucro" points="40,132 225,176 410,154 595,128 780,110 960,116" />
          <polyline className="custo" points="40,188 225,198 410,190 595,184 780,180 960,184" />
          <circle className="ponto faturamento" cx="40" cy="58" r="4" />
          <circle className="ponto faturamento" cx="225" cy="132" r="4" />
          <circle className="ponto faturamento" cx="410" cy="96" r="4" />
          <circle className="ponto faturamento" cx="595" cy="62" r="4" />
          <circle className="ponto faturamento" cx="780" cy="32" r="4" />
          <circle className="ponto faturamento" cx="960" cy="42" r="4" />
          <circle className="ponto lucro" cx="40" cy="132" r="4" />
          <circle className="ponto lucro" cx="225" cy="176" r="4" />
          <circle className="ponto lucro" cx="410" cy="154" r="4" />
          <circle className="ponto lucro" cx="595" cy="128" r="4" />
          <circle className="ponto lucro" cx="780" cy="110" r="4" />
          <circle className="ponto lucro" cx="960" cy="116" r="4" />
        </svg>

        <div className="meses-grafico">
          {meses.map((mes) => <span key={mes}>{mes}</span>)}
        </div>

        <div className="legenda-linhas">
          <span className="faturamento">Faturamento</span>
          <span className="custo">Custo</span>
          <span className="lucro">Lucro</span>
        </div>
      </div>
    </section>
  )
}
