import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import ConfiguracaoNotificacao from './ConfiguracaoNotificacao'
import api from '../../services/api'
import renderComToast from '../../test/renderComToast'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
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

describe('botão de notificação de teste', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function abrir(config = CONFIG) {
    api.get.mockResolvedValueOnce({ data: config })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)
    await screen.findByDisplayValue('17:30')
    return screen.getByRole('button', { name: 'Enviar notificação de teste' })
  }

  it('envia o teste e informa o resultado sem fechar a janela', async () => {
    api.post.mockResolvedValueOnce({ data: { idNotificacao: 57, statusEnvio: 'PENDENTE' } })
    const botao = await abrir()

    fireEvent.click(botao)

    expect(await screen.findByText(/chega ao WhatsApp em instantes/)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/notificacoes/teste')
    expect(api.put).not.toHaveBeenCalled()
  })

  it('avisa quando o teste ficou só no sino', async () => {
    api.post.mockResolvedValueOnce({ data: { idNotificacao: 57, statusEnvio: 'NAO_ENVIAR' } })
    fireEvent.click(await abrir())

    expect(await screen.findByText(/criada só no sino/)).toBeInTheDocument()
  })

  it('desabilita o botão enquanto envia', async () => {
    let concluir
    api.post.mockReturnValueOnce(new Promise((resolve) => { concluir = resolve }))
    fireEvent.click(await abrir())

    const enviando = await screen.findByRole('button', { name: 'Enviando...' })
    expect(enviando).toBeDisabled()

    concluir({ data: { statusEnvio: 'PENDENTE' } })
    expect(await screen.findByRole('button', { name: 'Enviar notificação de teste' })).toBeEnabled()
  })

  it('desabilita o botão pelos segundos recebidos no 429 e libera ao terminar', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 429, data: { message: 'Aguarde para enviar outra notificação de teste.', segundosRestantes: 1 } },
    })
    fireEvent.click(await abrir())

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Aguarde para enviar outra notificação de teste.')
    expect(screen.getByRole('button', { name: 'Aguarde 1 s para testar de novo' })).toBeDisabled()
    expect(await screen.findByRole('button', { name: 'Enviar notificação de teste' }, { timeout: 2500 })).toBeEnabled()
  })

  it('mostra erro genérico quando o teste falha sem resposta', async () => {
    api.post.mockRejectedValueOnce(new Error('offline'))
    const botao = await abrir()
    fireEvent.click(botao)

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Não foi possível enviar a notificação de teste.')
    expect(botao).toBeEnabled()
  })

  it('desabilita o botão com um interruptor desligado e explica o motivo', async () => {
    const botao = await abrir({ ...CONFIG, assistenteAtivo: false })

    expect(botao).toBeDisabled()
    expect(botao).toHaveAccessibleDescription('Ligue o assistente e os avisos automáticos para testar o WhatsApp.')
  })
})

describe('ConfiguracaoNotificacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega as configurações atuais', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/configuracao-notificacao'))
    expect(await screen.findByDisplayValue('17:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('salva as configurações, avisa por toast e fecha', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    const aoFechar = vi.fn()
    renderComToast(<ConfiguracaoNotificacao aoFechar={aoFechar} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/configuracao-notificacao', expect.objectContaining({ diasAntecedencia: 3 })))
    expect(await screen.findByText('Configurações salvas.')).toBeInTheDocument()
    expect(aoFechar).toHaveBeenCalledTimes(1)
  })

  it('mostra erro e mantém a janela aberta ao falhar o salvamento', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockRejectedValueOnce(new Error('offline'))
    const aoFechar = vi.fn()
    renderComToast(<ConfiguracaoNotificacao aoFechar={aoFechar} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Não foi possível salvar as configurações. Tente novamente.')
    expect(screen.getByRole('region', { name: 'Avisos' })).toHaveTextContent('')
    expect(aoFechar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Salvar configuração' })).toBeEnabled()
  })

  it.each(['Avisos automáticos', 'Assistente ativo'])('desabilita os avisos individuais com "%s" desligado e mantém os valores', async (rotulo) => {
    api.get.mockResolvedValueOnce({ data: { ...CONFIG, resumoFimDiaAtivo: false } })
    api.put.mockResolvedValueOnce({ data: CONFIG })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

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
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

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
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('Carregando configurações...')
  })

  it('mostra o estado vazio quando a API não devolve configuração', async () => {
    api.get.mockResolvedValueOnce({ data: null })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(await screen.findByText('Nenhuma configuração encontrada.')).toHaveAttribute('role', 'status')
  })

  it('renderiza os grupos com classes próprias, cada checkbox dentro do seu rótulo', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    const { container } = renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

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
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('O fim do expediente deve ser após o início.')
  })

  it('bloqueia salvar sem dia de expediente com mensagem PT-BR', async () => {
    api.get.mockResolvedValueOnce({ data: { ...CONFIG, diasExpediente: ['MONDAY'] } })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    await screen.findByDisplayValue('17:30')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Segunda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Selecione ao menos um dia de expediente.')
    expect(api.put).not.toHaveBeenCalled()
  })

  it('mostra erro ao falhar o carregamento', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'))
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Não foi possível carregar as configurações.')
  })

  it('põe o foco na janela ao abrir e fecha com Esc', async () => {
    const aoFechar = vi.fn()
    api.get.mockResolvedValueOnce({ data: CONFIG })
    renderComToast(<ConfiguracaoNotificacao aoFechar={aoFechar} />)
    await screen.findByDisplayValue('17:30')

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })

    expect(aoFechar).toHaveBeenCalledTimes(1)
  })

  it('não fecha com Esc enquanto salva', async () => {
    const aoFechar = vi.fn()
    api.get.mockResolvedValueOnce({ data: CONFIG })
    api.put.mockReturnValueOnce(new Promise(() => {}))
    renderComToast(<ConfiguracaoNotificacao aoFechar={aoFechar} />)
    await screen.findByDisplayValue('17:30')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(aoFechar).not.toHaveBeenCalled()
  })

  it('prende o Tab dentro da janela nos dois sentidos', async () => {
    api.get.mockResolvedValueOnce({ data: CONFIG })
    renderComToast(<ConfiguracaoNotificacao aoFechar={vi.fn()} />)
    await screen.findByDisplayValue('17:30')
    const fechar = screen.getByRole('button', { name: 'Fechar' })
    const salvar = screen.getByRole('button', { name: 'Salvar configuração' })

    salvar.focus()
    fireEvent.keyDown(salvar, { key: 'Tab' })
    expect(fechar).toHaveFocus()

    fireEvent.keyDown(fechar, { key: 'Tab', shiftKey: true })
    expect(salvar).toHaveFocus()
  })
})
