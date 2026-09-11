import { X } from 'lucide-react'

export default function ConfiguracaoFarol({ dados, aoAlterar, aoSalvar, aoFechar, salvando, erro }) {
  return (
    <div className="farol-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-farol">
      <form className="farol-modal" onSubmit={aoSalvar}>
        <header>
          <div><h2 id="titulo-farol">Configurar farol da agenda</h2><p>Defina quantos pedidos deixam cada dia em alerta.</p></div>
          <button type="button" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="farol-fields">
          <label><span className="farol-dot green" /> Limite verde
            <input name="limiteVerde" type="number" min="0" value={dados.limiteVerde} onChange={aoAlterar} placeholder="Ex.: 1" />
            <small>Quantidade maxima para um dia tranquilo.</small>
          </label>
          <label><span className="farol-dot yellow" /> Limite amarelo
            <input name="limiteAmarelo" type="number" min="0" value={dados.limiteAmarelo} onChange={aoAlterar} placeholder="Ex.: 3" />
            <small>A partir desta quantidade, o dia entra em atencao.</small>
          </label>
          <label><span className="farol-dot red" /> Limite vermelho
            <input name="limiteVermelho" type="number" min="0" value={dados.limiteVermelho} onChange={aoAlterar} placeholder="Ex.: 5" />
            <small>A partir desta quantidade, o dia fica lotado.</small>
          </label>
        </div>

        {erro && <p className="form-error">{erro}</p>}
        <footer><button type="button" className="outline-button" onClick={aoFechar}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar configuracao'}</button></footer>
      </form>
    </div>
  )
}
