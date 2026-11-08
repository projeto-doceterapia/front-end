import { describe, expect, it } from 'vitest'
import { diasEntre, formatarData, mesAtual, mesPassado, ultimosDias, ultimosMeses, validarPeriodo } from './periodoUtils'

describe('periodoUtils', () => {
  it('monta o mês atual do primeiro ao último dia', () => {
    expect(mesAtual(new Date(2026, 10, 18))).toEqual({ de: '2026-11-01', ate: '2026-11-30' })
    expect(mesAtual(new Date(2028, 1, 10))).toEqual({ de: '2028-02-01', ate: '2028-02-29' })
  })

  it('monta o mês passado, inclusive na virada do ano', () => {
    expect(mesPassado(new Date(2026, 10, 18))).toEqual({ de: '2026-10-01', ate: '2026-10-31' })
    expect(mesPassado(new Date(2026, 0, 5))).toEqual({ de: '2025-12-01', ate: '2025-12-31' })
  })

  it('monta os últimos meses até o fim do mês atual', () => {
    expect(ultimosMeses(new Date(2026, 10, 18), 3)).toEqual({ de: '2026-09-01', ate: '2026-11-30' })
  })

  it('monta os últimos dias a partir de hoje', () => {
    expect(ultimosDias(new Date(2026, 10, 3), 30)).toEqual({ de: '2026-10-04', ate: '2026-11-03' })
  })

  it('usa a data local às 23h30, sem trocar o dia por UTC', () => {
    expect(formatarData(new Date(2026, 10, 18, 23, 30))).toBe('2026-11-18')
    expect(mesAtual(new Date(2026, 10, 30, 23, 30)).ate).toBe('2026-11-30')
  })

  it('conta dias sem se confundir com horário de verão', () => {
    expect(diasEntre('2026-01-01', '2027-01-02')).toBe(366)
    expect(diasEntre('2026-10-01', '2026-11-01')).toBe(31)
  })

  it('aceita até 366 dias e recusa 367', () => {
    expect(validarPeriodo('2026-01-01', '2027-01-02')).toBeNull()
    expect(validarPeriodo('2026-01-01', '2027-01-03')).toMatch(/366 dias/)
  })

  it('recusa datas vazias ou invertidas', () => {
    expect(validarPeriodo('', '2026-11-30')).toMatch(/Informe/)
    expect(validarPeriodo('2026-11-30', '2026-11-01')).toMatch(/anterior ou igual/)
    expect(validarPeriodo('2026-11-01', '2026-11-01')).toBeNull()
  })
})
