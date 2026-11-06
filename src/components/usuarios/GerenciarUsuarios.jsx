import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import useToast from '../feedback/useToast'
import { criarUsuario, listarUsuarios } from '../../services/usuarios'
import { ROTULOS_PERFIL } from './perfis'

const FORMULARIO_VAZIO = { nome: '', email: '', senha: '', perfil: 'FUNCIONARIA' }

export default function GerenciarUsuarios({ aoFechar }) {
  const toast = useToast()
  const dialogo = useRef(null)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    listarUsuarios()
      .then((lista) => { if (ativo) setUsuarios(lista) })
      .catch((falha) => { if (ativo) setErroLista(falha.response?.data?.message || 'Não foi possível carregar os usuários.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    dialogo.current?.focus()
  }, [])

  function alterarCampo(evento) {
    const { name, value } = evento.target
    setFormulario((atual) => ({ ...atual, [name]: value }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      await criarUsuario(formulario)
      toast.sucesso('Usuário criado.')
      setFormulario(FORMULARIO_VAZIO)
      setUsuarios(await listarUsuarios())
    } catch (falha) {
      setErro(falha.response?.data?.message || 'Não foi possível criar o usuário. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function aoTeclar(evento) {
    if (evento.key === 'Escape') aoFechar()
  }

  return (
    <div className="farol-overlay" onKeyDown={aoTeclar}>
      <div
        ref={dialogo}
        className="farol-modal usuarios-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-usuarios"
        tabIndex={-1}
      >
        <header>
          <div>
            <h2 id="titulo-usuarios">Usuários</h2>
            <p>Veja quem acessa o sistema e cadastre novas pessoas.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        <section className="usuarios-lista" aria-label="Usuários cadastrados">
          {carregando && <p role="status">Carregando usuários...</p>}
          {!carregando && erroLista && <p className="form-error" role="alert">{erroLista}</p>}
          {!carregando && !erroLista && usuarios.length === 0 && <p>Nenhum usuário cadastrado.</p>}
          {!carregando && !erroLista && usuarios.length > 0 && (
            <ul>
              {usuarios.map((usuario) => (
                <li key={usuario.id}>
                  <span><strong>{usuario.nome}</strong><small>{usuario.email}</small></span>
                  <span className="usuarios-perfil">{ROTULOS_PERFIL[usuario.perfil] ?? usuario.perfil}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={salvar}>
          <fieldset className="farol-fields usuarios-form">
            <legend>Novo usuário</legend>
            <label>Nome
              <input name="nome" value={formulario.nome} onChange={alterarCampo} required minLength={3} maxLength={50} />
            </label>
            <label>E-mail
              <input name="email" type="email" value={formulario.email} onChange={alterarCampo} required />
            </label>
            <label>Senha
              <input
                name="senha"
                type="password"
                autoComplete="new-password"
                value={formulario.senha}
                onChange={alterarCampo}
                required
                minLength={6}
                maxLength={20}
              />
              <small>De 6 a 20 caracteres.</small>
            </label>
            <label>Perfil
              <select name="perfil" value={formulario.perfil} onChange={alterarCampo}>
                <option value="FUNCIONARIA">{ROTULOS_PERFIL.FUNCIONARIA}</option>
                <option value="DONA">{ROTULOS_PERFIL.DONA}</option>
              </select>
            </label>
          </fieldset>
          {erro && <p className="form-error usuarios-erro" role="alert">{erro}</p>}
          <footer>
            <button type="button" className="outline-button" onClick={aoFechar}>Fechar</button>
            <button className="primary-button" disabled={salvando}>{salvando ? 'Criando...' : 'Criar usuário'}</button>
          </footer>
        </form>
      </div>
    </div>
  )
}
