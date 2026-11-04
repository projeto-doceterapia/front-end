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
  avisosAutomaticosAtivo: true,
  assistenteAtivo: true,
}

const ROTULOS_ALERTAS = ['Resumo de início do dia', 'Resumo de fim do dia', 'Alerta de estoque baixo', 'Alerta de dia lotado']

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
    expect(await screen.findByRole('status')).toHaveTextContent('Configurações salvas.')
    expect(aoFechar).not.toHaveBeenCalled()
    await waitFor(() => expect(aoFechar).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })

  it('mostra erro e mantém a janela aberta ao falhar o salvamento', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockRejectedValueOnce(new Error('offline'))
    const aoFechar = vi.fn()
    render(<ConfiguracaoNotificacao aoFechar={aoFechar} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar as configurações. Tente novamente.')
    expect(aoFechar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Salvar configuração' })).toBeEnabled()
  })

  it('não fecha depois de salvar se a janela já foi cancelada', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    const aoFechar = vi.fn()
    const { unmount } = render(<ConfiguracaoNotificacao aoFechar={aoFechar} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))
    await screen.findByRole('status')
    unmount()

    await new Promise((resolve) => { setTimeout(resolve, 1700) })
    expect(aoFechar).not.toHaveBeenCalled()
  })

  it.each(['Avisos automáticos', 'Assistente ativo'])('desabilita os avisos individuais com "%s" desligado e mantém os valores', async (rotulo) => {
    api.get.mockResolvedValueOnce({ data: { ...CONFIG, resumoFimDiaAtivo: false } })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    ROTULOS_ALERTAS.forEach((nome) => expect(screen.getByRole('checkbox', { name: nome })).toBeEnabled())

    fireEvent.click(screen.getByRole('checkbox', { name: rotulo }))

    ROTULOS_ALERTAS.forEach((nome) => expect(screen.getByRole('checkbox', { name: nome })).toBeDisabled())
    expect(screen.getByRole('checkbox', { name: 'Resumo de início do dia' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Resumo de fim do dia' })).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/configuracao-notificacao', expect.objectContaining({
      resumoInicioDiaAtivo: true,
      resumoFimDiaAtivo: false,
      estoqueBaixoAtivo: true,
      diaLotadoAtivo: true,
    })))
  })

  it('envia os dois interruptores no PUT e descreve cada um', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    const assistente = screen.getByRole('checkbox', { name: 'Assistente ativo' })
    expect(assistente).toHaveAccessibleDescription('Pausa conversa, leitura de notas e avisos.')
    expect(screen.getByRole('checkbox', { name: 'Avisos automáticos' })).toHaveAccessibleDescription('Pausa só os avisos no WhatsApp. Eles continuam no sino.')

    fireEvent.click(assistente)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/configuracao-notificacao', expect.objectContaining({
      assistenteAtivo: false,
      avisosAutomaticosAtivo: true,
    })))
  })

  it('mostra o estado de carregamento', () => {
    api.get.mockReturnValueOnce(new Promise(() => {}))
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Carregando configurações...')
  })

  it('mostra o estado vazio quando a API não devolve configuração', async () => {
    api.get.mockResolvedValueOnce({ data: null })
    render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(await screen.findByText('Nenhuma configuração encontrada.')).toHaveAttribute('role', 'status')
  })

  it('renderiza os grupos com classes próprias, cada checkbox dentro do seu rótulo', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    const { container } = render(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')

    expect(container.querySelector('.farol-fields')).toBeNull()
    container.querySelectorAll('input[type="checkbox"]').forEach((caixa) => {
      expect(caixa.closest('label')).toHaveClass('config-notificacao-check')
    })
    expect(screen.getByLabelText('Horário do resumo de fim').closest('label')).toHaveClass('config-notificacao-horario')
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
