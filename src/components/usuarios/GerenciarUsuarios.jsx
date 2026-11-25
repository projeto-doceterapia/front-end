import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import useToast from '../feedback/useToast'
import { criarUsuario, listarUsuarios } from '../../services/usuarios'
import { DESCRICOES_PERFIL, ROTULOS_PERFIL } from './perfis'

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
  const [senhaVisivel, setSenhaVisivel] = useState(false)

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
          <fieldset className="usuarios-form">
            <legend>Adicionar pessoa</legend>
            <label>Nome
              <input name="nome" value={formulario.nome} onChange={alterarCampo} required minLength={3} maxLength={50} />
            </label>
            <label>E-mail
              <input name="email" type="email" value={formulario.email} onChange={alterarCampo} required />
            </label>
            <div className="usuarios-campo">
              <label htmlFor="usuarios-senha">Senha</label>
              <span className="usuarios-senha">
                <input
                  id="usuarios-senha"
                  name="senha"
                  type={senhaVisivel ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formulario.senha}
                  onChange={alterarCampo}
                  required
                  minLength={6}
                  maxLength={20}
                  aria-describedby="usuarios-senha-ajuda"
                />
                <button
                  type="button"
                  className="usuarios-ver-senha"
                  aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={senhaVisivel}
                  onClick={() => setSenhaVisivel(!senhaVisivel)}
                >
                  {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
              <small id="usuarios-senha-ajuda">De 6 a 20 caracteres.</small>
            </div>
            <div className="usuarios-campo">
              <label htmlFor="usuarios-perfil">Perfil</label>
              <select id="usuarios-perfil" name="perfil" value={formulario.perfil} onChange={alterarCampo} aria-describedby="usuarios-perfil-ajuda">
                <option value="FUNCIONARIA">{ROTULOS_PERFIL.FUNCIONARIA}</option>
                <option value="DONA">{ROTULOS_PERFIL.DONA}</option>
              </select>
              <small id="usuarios-perfil-ajuda">{DESCRICOES_PERFIL[formulario.perfil]}</small>
            </div>
          </fieldset>
          {erro && <p className="form-error usuarios-erro" role="alert">{erro}</p>}
          <footer>
            <button className="primary-button" disabled={salvando}>{salvando ? 'Adicionando...' : 'Adicionar pessoa'}</button>
          </footer>
        </form>
      </div>
    </div>
  )
}
