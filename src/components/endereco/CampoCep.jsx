import { useRef, useState } from 'react'
import { buscarEndereco, ERRO_CEP } from '../../services/cep'
import { formatarCep, somenteDigitos } from './enderecoUtils'

const MENSAGEM_BUSCANDO = 'Buscando endereço...'
const MENSAGEM_ENCONTRADO = 'Endereço encontrado. Complete com o número e o complemento.'
const MENSAGEM_INCOMPLETO = 'Informe os 8 dígitos do CEP.'
const MENSAGENS_ERRO = {
  [ERRO_CEP.NAO_ENCONTRADO]: 'CEP não encontrado. Digite o endereço manualmente.',
  [ERRO_CEP.INDISPONIVEL]: 'Não foi possível consultar o CEP agora. Digite o endereço manualmente.',
}

export default function CampoCep({ id, valor, onChange, onEnderecoEncontrado }) {
  const [aviso, setAviso] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [invalido, setInvalido] = useState(false)
  const consultaAtual = useRef('')

  async function consultar(digitos) {
    setBuscando(true)
    try {
      const endereco = await buscarEndereco(digitos)
      if (consultaAtual.current !== digitos) return
      onEnderecoEncontrado(endereco)
      setAviso(MENSAGEM_ENCONTRADO)
    } catch (erro) {
      if (consultaAtual.current !== digitos) return
      setAviso(MENSAGENS_ERRO[erro.codigo] ?? MENSAGENS_ERRO[ERRO_CEP.INDISPONIVEL])
    } finally {
      if (consultaAtual.current === digitos) setBuscando(false)
    }
  }

  function aoDigitar(evento) {
    const digitos = somenteDigitos(evento.target.value).slice(0, 8)
    consultaAtual.current = digitos
    onChange(digitos)
    setInvalido(false)
    setAviso('')
    setBuscando(false)
    if (digitos.length === 8) consultar(digitos)
  }

  function aoSair() {
    const digitos = somenteDigitos(valor)
    if (digitos.length > 0 && digitos.length < 8) {
      setInvalido(true)
      setAviso(MENSAGEM_INCOMPLETO)
    }
  }

  return (
    <div className="zip-field">
      <label htmlFor={id}>CEP</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={9}
        placeholder="00000-000"
        value={formatarCep(valor)}
        onChange={aoDigitar}
        onBlur={aoSair}
        aria-invalid={invalido ? 'true' : undefined}
        aria-busy={buscando ? 'true' : undefined}
        aria-describedby={`${id}-ajuda`}
      />
      <p id={`${id}-ajuda`} className="zip-feedback" role="status">
        {buscando ? MENSAGEM_BUSCANDO : aviso}
      </p>
    </div>
  )
}
