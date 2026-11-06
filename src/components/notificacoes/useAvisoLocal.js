import { useCallback, useMemo, useState } from 'react'

export default function useAvisoLocal() {
  const [aviso, setAviso] = useState(null)

  const sucesso = useCallback((texto) => setAviso({ tipo: 'sucesso', texto }), [])
  const erro = useCallback((texto) => setAviso({ tipo: 'erro', texto }), [])
  const limpar = useCallback(() => setAviso(null), [])

  return useMemo(() => ({ aviso, sucesso, erro, limpar }), [aviso, sucesso, erro, limpar])
}
