import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CampoCep from './CampoCep'
import { buscarEndereco, ERRO_CEP } from '../../services/cep'

vi.mock('../../services/cep', () => ({
  buscarEndereco: vi.fn(),
  ERRO_CEP: {
    INVALIDO: 'CEP_INVALIDO',
    NAO_ENCONTRADO: 'CEP_NAO_ENCONTRADO',
    INDISPONIVEL: 'SERVICO_INDISPONIVEL',
  },
}))

const ENDERECO = { rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' }

function erroCep(codigo) {
  return Object.assign(new Error(codigo), { codigo })
}

function Exemplo({ onChange, onEnderecoEncontrado }) {
  const [valor, setValor] = useState('')
  return (
    <CampoCep
      id="cep-teste"
      valor={valor}
      onChange={(digitos) => {
        setValor(digitos)
        onChange?.(digitos)
      }}
      onEnderecoEncontrado={onEnderecoEncontrado ?? vi.fn()}
    />
  )
}

const campo = () => screen.getByLabelText('CEP')
const digitar = (texto) => fireEvent.change(campo(), { target: { value: texto } })

describe('CampoCep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aplica a máscara', () => {
    const onChange = vi.fn()
    render(<Exemplo onChange={onChange} />)

    digitar('01001000')
    expect(campo()).toHaveValue('01001-000')
    expect(onChange).toHaveBeenLastCalledWith('01001000')

    digitar('010010009999')
    expect(onChange).toHaveBeenLastCalledWith('01001000')
  })

  it('CEP válido preenche o endereço', async () => {
    buscarEndereco.mockResolvedValue(ENDERECO)
    const onEnderecoEncontrado = vi.fn()
    render(<Exemplo onEnderecoEncontrado={onEnderecoEncontrado} />)

    digitar('01001000')

    expect(buscarEndereco).toHaveBeenCalledWith('01001000')
    expect(screen.getByRole('status')).toHaveTextContent('Buscando endereço...')
    await waitFor(() => expect(onEnderecoEncontrado).toHaveBeenCalledWith(ENDERECO))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Endereço encontrado. Complete com o número e o complemento.'
    )
  })

  it('CEP não encontrado', async () => {
    buscarEndereco.mockRejectedValue(erroCep(ERRO_CEP.NAO_ENCONTRADO))
    const onEnderecoEncontrado = vi.fn()
    render(<Exemplo onEnderecoEncontrado={onEnderecoEncontrado} />)

    digitar('99999999')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'CEP não encontrado. Digite o endereço manualmente.'
      )
    )
    expect(campo()).not.toBeDisabled()
    expect(onEnderecoEncontrado).not.toHaveBeenCalled()
  })

  it('serviço fora', async () => {
    buscarEndereco.mockRejectedValue(erroCep(ERRO_CEP.INDISPONIVEL))
    render(<Exemplo />)

    digitar('01001000')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Não foi possível consultar o CEP agora. Digite o endereço manualmente.'
      )
    )
    expect(campo()).not.toBeDisabled()
  })

  it('valida 8 dígitos', () => {
    render(<Exemplo />)

    digitar('01001')
    fireEvent.blur(campo())

    expect(screen.getByRole('status')).toHaveTextContent('Informe os 8 dígitos do CEP.')
    expect(campo()).toHaveAttribute('aria-invalid', 'true')
    expect(buscarEndereco).not.toHaveBeenCalled()
  })

  it('campo vazio é válido', () => {
    render(<Exemplo />)

    fireEvent.blur(campo())

    expect(campo()).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('descarta a resposta de um CEP que já foi trocado', async () => {
    let resolver
    buscarEndereco.mockReturnValueOnce(new Promise((resolve) => (resolver = resolve)))
    const onEnderecoEncontrado = vi.fn()
    render(<Exemplo onEnderecoEncontrado={onEnderecoEncontrado} />)

    digitar('01001000')
    digitar('0100100')
    resolver(ENDERECO)
    await Promise.resolve()

    expect(onEnderecoEncontrado).not.toHaveBeenCalled()
  })
})
