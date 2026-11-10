import { useId, useState } from 'react'
import useToast from '../feedback/useToast'
import { salvarCategoria } from '../../services/produtos'
import DialogoCatalogo from './DialogoCatalogo'
import { mensagemErroProduto } from './precificacaoUtils'
import '../../styles/produtos.css'

const CATEGORIA_REPETIDA = 'Já existe uma categoria com esse nome.'

export default function CategoriaProdutoForm({ categoria, aoFechar, aoSalva }) {
  const toast = useToast()
  const idBase = useId()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [descricao, setDescricao] = useState(categoria?.descricao ?? '')
  const [salvando, setSalvando] = useState(false)

  async function enviar(event) {
    event.preventDefault()
    if (salvando) return

    setSalvando(true)
    try {
      await salvarCategoria({
        idCategoriaProduto: categoria?.idCategoriaProduto,
        nome: nome.trim(),
        descricao: descricao.trim(),
      })
      toast.sucesso('Categoria salva.')
      aoSalva()
    } catch (falha) {
      const repetida = falha.response?.status === 409
      toast.erro(mensagemErroProduto(falha, repetida ? CATEGORIA_REPETIDA : undefined))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <DialogoCatalogo
      titulo={categoria ? 'Editar categoria' : 'Nova categoria'}
      aoFechar={aoFechar}
      ocupado={salvando}
    >
      <form onSubmit={enviar}>
        <div className="dialogo-campos">
          <div className="campo">
            <label htmlFor={`${idBase}-nome`}>Nome</label>
            <input
              id={`${idBase}-nome`}
              required
              autoFocus
              maxLength={100}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor={`${idBase}-descricao`}>Descrição</label>
            <textarea
              id={`${idBase}-descricao`}
              maxLength={245}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>
        <footer>
          <button type="button" className="outline-button" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </button>
          <button className="primary-button" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar categoria'}
          </button>
        </footer>
      </form>
    </DialogoCatalogo>
  )
}
