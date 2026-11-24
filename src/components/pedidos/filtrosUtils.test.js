import { describe, expect, it } from 'vitest'
import {
  dataISO, dividirEmLotes, filtroAberturaAgenda, filtroAberturaHistorico, filtroAberturaProducao, filtroDoMes,
  formatarDataCompleta, mensagemErroCarga, periodoCobreMes, somarDias, STATUS_AGENDA, STATUS_PRODUCAO, validarFiltro,
} from './filtrosUtils'

const HOJE = new Date(2026, 10, 16, 23, 30)

describe('filtrosUtils', () => {
  it('dataISO usa a data local', () => {
    expect(dataISO(HOJE)).toBe('2026-11-16')
  })

  it('somarDias atravessa meses e anos', () => {
    expect(somarDias('2026-11-16', -30)).toBe('2026-10-17')
    expect(somarDias('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('filtros de abertura', () => {
    expect(filtroAberturaAgenda(HOJE)).toEqual({ de: '2026-11-16', ate: '2026-11-23', status: STATUS_AGENDA })
    expect(STATUS_AGENDA).not.toContain('CANCELADO')
    expect(filtroAberturaProducao(HOJE)).toEqual({ de: '2026-10-17', ate: '2026-11-23', status: STATUS_PRODUCAO })
    expect(filtroAberturaHistorico(HOJE)).toEqual({ de: '2026-08-18', ate: '2026-11-16', status: [] })
  })

  it('validarFiltro', () => {
    expect(validarFiltro({ de: '', ate: '2026-11-16', status: [] })).toBe('Informe as duas datas do período.')
    expect(validarFiltro({ de: '2026-11-17', ate: '2026-11-16', status: [] })).toBe('A data inicial deve ser igual ou anterior à data final.')
    expect(validarFiltro({ de: '2025-01-01', ate: '2026-11-16', status: [] })).toBe('O período pode ter no máximo 366 dias.')
    expect(validarFiltro({ de: '2024-01-01', ate: '2025-01-01', status: [] })).toBeNull()
    expect(validarFiltro({ de: '2024-01-01', ate: '2025-01-02', status: [] })).toBe('O período pode ter no máximo 366 dias.')
    expect(validarFiltro({ de: '2026-11-16', ate: '2026-11-16', status: [] }, { exigeStatus: true })).toBe('Selecione ao menos uma etapa.')
    expect(validarFiltro({ de: '2026-11-16', ate: '2026-11-16', status: ['EM_PRODUCAO'] }, { exigeStatus: true })).toBeNull()
  })

  it('dividirEmLotes', () => {
    const ids = Array.from({ length: 1201 }, (_, indice) => indice + 1)
    expect(dividirEmLotes(ids, 500).map((lote) => lote.length)).toEqual([500, 500, 201])
    expect(dividirEmLotes(ids).map((lote) => lote.length)).toEqual([200, 200, 200, 200, 200, 200, 1])
    expect(dividirEmLotes([])).toEqual([])
  })

  it('mês exibido e período carregado', () => {
    const novembro = new Date(2026, 10, 1)
    expect(filtroDoMes(novembro, STATUS_AGENDA)).toEqual({ de: '2026-11-01', ate: '2026-11-30', status: STATUS_AGENDA })
    expect(periodoCobreMes({ de: '2026-11-16', ate: '2026-11-23' }, novembro)).toBe(false)
    expect(periodoCobreMes({ de: '2026-10-31', ate: '2026-12-01' }, novembro)).toBe(true)
  })

  it('formatarDataCompleta e mensagemErroCarga', () => {
    expect(formatarDataCompleta('2026-11-16')).toBe('16/11/2026')
    expect(mensagemErroCarga({ response: { data: { message: 'Período inválido.' } } })).toBe('Período inválido.')
    expect(mensagemErroCarga(new Error('Network Error'))).toMatch(/Não foi possível carregar os pedidos/)
  })
})
