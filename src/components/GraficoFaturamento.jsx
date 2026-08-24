import Filtros from './Filtros'

function GraficoFaturamento() {
  return (
    <section className="painel">
      <div className="titulo"><div><h2>Faturamento mensal x custo x lucro</h2><p>Últimos 6 meses</p></div><Filtros /></div>
      <div className="linhas"><svg viewBox="0 0 900 140" preserveAspectRatio="none"><polyline className="faturamento" points="40,35 210,80 380,60 550,40 720,22 880,28" /><polyline className="lucro" points="40,80 210,110 380,98 550,82 720,68 880,72" /><polyline className="custo" points="40,120 210,130 380,125 550,121 720,117 880,119" /></svg><p>← Faturamento &nbsp; ● Custo &nbsp; ♧ Lucro</p></div>
    </section>
  )
}

export default GraficoFaturamento
