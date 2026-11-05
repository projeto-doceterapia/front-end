import { useContext } from 'react'
import { SessaoContexto } from './sessaoContexto'

export default function useSessao() {
  const sessao = useContext(SessaoContexto)
  if (!sessao) throw new Error('useSessao must be used within SessaoProvider')

  // The API only sends perfil once user roles exist; until then the single user is the DONA.
  const perfil = sessao.usuario ? (sessao.usuario.perfil ?? 'DONA') : null

  return { ...sessao, perfil, ehDona: perfil === 'DONA' }
}
