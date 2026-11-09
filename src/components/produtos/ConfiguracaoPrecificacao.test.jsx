import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ConfiguracaoPrecificacao from './ConfiguracaoPrecificacao'
import renderComToast from '../../test/renderComToast'
import instalarApiFalsa, { FALHA_DE_REDE } from '../../test/apiFalsa'

function Tela({ aoSalvar = vi.fn() }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button onClick={() => setAberto(true)}>Precificação</button>
      {aberto && (
        <ConfiguracaoPrecificacao
          aoFechar={() => setAberto(false)}
          aoSalvar={() => {
            setAberto(false)
            aoSalvar()
          }}
        />
      )}
    </>
  )
}

function abrirDialogo(aoSalvar) {
  renderComToast(<Tela aoSalvar={aoSalvar} />)
  const botao = screen.getByRole('button', { name: 'Precificação' })
  botao.focus()
  fireEvent.click(botao)
  return botao
}

const CONFIGURACAO = { idConfiguracaoPrecificacao: 1, margemPadrao: 100, percentualIndiretos: 10 }

describe('ConfiguracaoPrecificacao', () => {
  it('carrega e salva a configuração', async () => {
    const api = instalarApiFalsa({
      'GET /configuracao-precificacao': { status: 200, data: CONFIGURACAO },
      'PUT /configuracao-precificacao': { status: 200, data: CONFIGURACAO },
    })
    const aoSalvar = vi.fn()
    abrirDialogo(aoSalvar)

    const dialogo = await screen.findByRole('dialog', { name: 'Precificação' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Margem padrão (%)')).toHaveValue('100')
    expect(screen.getByLabelText('Custos indiretos (%)')).toHaveValue('10')
    expect(screen.getByLabelText('Margem padrão (%)')).toHaveAccessibleDescription(/Percentual somado ao custo/)

    fireEvent.change(screen.getByLabelText('Margem padrão (%)'), { target: { value: '120,5' } })
    fireEvent.change(screen.getByLabelText('Custos indiretos (%)'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1))
    expect(JSON.parse(api.chamadasDe('PUT /configuracao-precificacao')[0].corpo)).toEqual({
      margemPadrao: 120.5,
      percentualIndiretos: 12,
    })
    expect(screen.getByText('Configuração de precificação salva.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha com Esc e devolve o foco ao botão', async () => {
    instalarApiFalsa({ 'GET /configuracao-precificacao': { status: 200, data: CONFIGURACAO } })
    const botao = abrirDialogo()

    const dialogo = await screen.findByRole('dialog')
    await screen.findByLabelText('Margem padrão (%)')
    fireEvent.keyDown(dialogo, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(botao).toHaveFocus()
  })

  it('foca o primeiro campo depois de carregar', async () => {
    instalarApiFalsa({ 'GET /configuracao-precificacao': { status: 200, data: CONFIGURACAO } })
    abrirDialogo()

    expect(await screen.findByLabelText('Margem padrão (%)')).toHaveFocus()
  })

  it('recusa valores fora dos limites sem chamar a API', async () => {
    const api = instalarApiFalsa({ 'GET /configuracao-precificacao': { status: 200, data: CONFIGURACAO } })
    abrirDialogo()

    await screen.findByLabelText('Margem padrão (%)')
    fireEvent.change(screen.getByLabelText('Custos indiretos (%)'), { target: { value: '100,01' } })
    fireEvent.change(screen.getByLabelText('Margem padrão (%)'), { target: { value: '1000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByText('Percentual de custos indiretos deve estar entre 0 e 100%')).toBeInTheDocument()
    expect(screen.getByText('Margem padrão deve estar entre 0 e 999,99%')).toBeInTheDocument()
    expect(screen.getByLabelText('Custos indiretos (%)')).toHaveAccessibleDescription(/entre 0 e 100%/)
    expect(api.chamadasDe('PUT /configuracao-precificacao')).toHaveLength(0)
  })

  it('mantém o diálogo aberto e avisa quando o servidor recusa', async () => {
    instalarApiFalsa({
      'GET /configuracao-precificacao': { status: 200, data: CONFIGURACAO },
      'PUT /configuracao-precificacao': { status: 400, data: { message: 'Margem padrão deve estar entre 0 e 999,99%' } },
    })
    abrirDialogo()

    await screen.findByLabelText('Margem padrão (%)')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }))

    expect(await screen.findByText('Margem padrão deve estar entre 0 e 999,99%')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Margem padrão (%)')).toHaveValue('100')
  })

  it('mostra o erro quando a configuração não carrega', async () => {
    instalarApiFalsa({ 'GET /configuracao-precificacao': FALHA_DE_REDE })
    abrirDialogo()

    expect(await screen.findByText('Não foi possível falar com o servidor. Tente novamente.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Margem padrão (%)')).not.toBeInTheDocument()
  })
})
