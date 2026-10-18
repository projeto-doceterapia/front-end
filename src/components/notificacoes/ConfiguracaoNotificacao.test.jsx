import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ConfiguracaoNotificacao from './ConfiguracaoNotificacao'
import api from '../../services/api'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

const CONFIG = {
  inicioExpediente: '08:00',
  fimExpediente: '18:00',
  diasExpediente: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  horarioResumoInicio: '08:00',
  horarioResumoFim: '17:30',
  diasAntecedencia: 3,
  resumoInicioDiaAtivo: true,
  resumoFimDiaAtivo: true,
  estoqueBaixoAtivo: true,
  diaLotadoAtivo: true,
}

describe('ConfiguracaoNotificacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega as configurações atuais', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/configuracao-notificacao'))
    expect(await screen.findByDisplayValue('17:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('salva as configurações e fecha', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    const aoFechar = vi.fn()
    render(<ConfiguracaoNotificacao aoFechar={aoFechar} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/configuracao-notificacao', expect.objectContaining({ diasAntecedencia: 3 })))
    expect(aoFechar).toHaveBeenCalled()
  })

  it('exibe a mensagem PT-BR do servidor para configuração inválida (422)', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockRejectedValueOnce({ response: { status: 422, data: { message: 'O fim do expediente deve ser após o início.' } } })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O fim do expediente deve ser após o início.')
  })

  it('bloqueia salvar sem dia de expediente com mensagem PT-BR', async () => {
    api.get.mockResolvedValueOnce({ data: { ...CONFIG, diasExpediente: ['MONDAY'] } })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Segunda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione ao menos um dia de expediente.')
    expect(api.put).not.toHaveBeenCalled()
  })

  it('mostra erro ao falhar o carregamento', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'))
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as configurações.')
  })
})
