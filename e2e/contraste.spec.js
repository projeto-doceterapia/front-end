import { expect, test } from '@playwright/test'
import { simularApi } from './support/apiFalsa'
import { textosSemContraste } from './support/contraste'

const TELAS = ['Agenda', 'Visão Geral', 'Produção', 'Clientes', 'Registrar Pedido', 'Histórico', 'Produtos', 'Estoque']

test.describe('Contraste mínimo dos textos', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const tela of TELAS) {
    test(tela, async ({ page }) => {
      await simularApi(page, { logado: true, dados: 'exemplo' })
      await page.goto('/')
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: tela, exact: true }).click()
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      await page.waitForTimeout(300)

      expect(await textosSemContraste(page)).toEqual([])
    })
  }
})

test.describe('Perfil FUNCIONARIA sem valores em dinheiro', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const tela of TELAS) {
    test(tela, async ({ page }) => {
      await simularApi(page, { logado: true, dados: 'exemplo', perfil: 'FUNCIONARIA' })
      await page.goto('/')
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: tela, exact: true }).click()
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      await page.waitForTimeout(300)

      if (!['Registrar Pedido', 'Produtos'].includes(tela)) {
        await expect(page.locator('main')).not.toContainText('R$')
      }
      expect(await textosSemContraste(page)).toEqual([])
    })
  }
})
