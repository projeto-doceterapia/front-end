import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useToast from '../feedback/useToast'
import { definirAoExpirarSessao } from '../../services/api'
import { buscarUsuarioLogado, encerrar, entrar as autenticar } from '../../services/sessao'
import { SessaoContexto } from './sessaoContexto'

export default function SessaoProvider({ children }) {
  const toast = useToast()
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  // Simultaneous 401s arrive before a re-render, so the "is there a user" check needs a synchronous value.
  const usuarioAtual = useRef(null)

  const publicarUsuario = useCallback((proximo) => {
    usuarioAtual.current = proximo
    setUsuario(proximo)
  }, [])

  useEffect(() => {
    let ativo = true
    buscarUsuarioLogado()
      .then((encontrado) => { if (ativo) publicarUsuario(encontrado) })
      .catch(() => { if (ativo) publicarUsuario(null) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [publicarUsuario])

  // Only changes state: firing a request from here would loop on another 401.
  useEffect(() => definirAoExpirarSessao(() => {
    if (!usuarioAtual.current) return
    publicarUsuario(null)
    toast.erro('Sua sessão expirou. Entre novamente.')
  }), [publicarUsuario, toast])

  const entrar = useCallback(async (email, senha) => {
    await autenticar(email, senha)
    publicarUsuario(await buscarUsuarioLogado())
  }, [publicarUsuario])

  const sair = useCallback(async () => {
    try {
      await encerrar()
    } catch (erro) {
      // The HttpOnly cookie is only removed by the server, so a failed call leaves the session alive.
      if (erro.response?.status !== 401) {
        toast.erro('Não foi possível sair. Tente novamente.')
        return
      }
    }
    publicarUsuario(null)
  }, [publicarUsuario, toast])

  const sessao = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair])

  return <SessaoContexto.Provider value={sessao}>{children}</SessaoContexto.Provider>
}
