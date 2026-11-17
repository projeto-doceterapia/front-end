import { useCallback, useEffect, useRef, useState } from 'react'
import { carregarPedidosComRelacionamentos } from '../../services/pedidosConsulta'
import { mensagemErroCarga } from './filtrosUtils'

export default function useRecortePedidos(criarFiltroAbertura) {
  const [abertura] = useState(criarFiltroAbertura)
  const [filtro, setFiltro] = useState(abertura)
  const [pedidos, setPedidos] = useState([])
  const [itens, setItens] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const requisicao = useRef(null)

  const carregar = useCallback(async (novoFiltro) => {
    requisicao.current?.abort()
    const controle = new AbortController()
    requisicao.current = controle
    setFiltro(novoFiltro)
    setCarregando(true)
    setErro('')
    try {
      const recorte = await carregarPedidosComRelacionamentos(novoFiltro, { signal: controle.signal })
      if (requisicao.current !== controle) return
      setPedidos(recorte.pedidos)
      setItens(recorte.itens)
      setPagamentos(recorte.pagamentos)
    } catch (falha) {
      // A newer filter already replaced this request, so its outcome is irrelevant.
      if (requisicao.current !== controle) return
      setPedidos([])
      setItens([])
      setPagamentos([])
      setErro(mensagemErroCarga(falha))
      console.error(falha)
    } finally {
      if (requisicao.current === controle) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar(abertura)
    return () => requisicao.current?.abort()
  }, [carregar, abertura])

  return { filtro, pedidos, setPedidos, itens, pagamentos, carregando, erro, carregar }
}
