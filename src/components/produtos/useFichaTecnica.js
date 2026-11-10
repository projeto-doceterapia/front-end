import { useCallback, useEffect, useRef, useState } from 'react'
import { listarFicha } from '../../services/produtos'

export default function useFichaTecnica(produtoId) {
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const montado = useRef(true)

  const recarregar = useCallback(
    () =>
      listarFicha(produtoId)
        .then((dados) => {
          if (montado.current) {
            setLinhas(dados)
            setErro(false)
          }
        })
        .catch(() => {
          if (montado.current) setErro(true)
        })
        .finally(() => {
          if (montado.current) setCarregando(false)
        }),
    [produtoId],
  )

  useEffect(() => {
    montado.current = true
    recarregar()
    return () => {
      montado.current = false
    }
  }, [recarregar])

  return { linhas, carregando, erro, recarregar }
}
