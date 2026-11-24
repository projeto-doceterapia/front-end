import { expect, test } from '@playwright/test'
import { simularApi } from './support/apiFalsa'

const LARGURAS = [390, 768, 1440]
// The API fake answers every list with [], which the overview indicators cannot render.
const TELAS = ['Agenda', 'Produção', 'Clientes', 'Registrar Pedido', 'Histórico', 'Produtos', 'Estoque']

for (const largura of LARGURAS) {
  test.describe(`Telas em ${largura} px`, () => {
    test.use({ viewport: { width: largura, height: 844 } })

    for (const tela of TELAS) {
      test(`${tela} sem rolagem horizontal da página`, async ({ page }, info) => {
        await simularApi(page, { logado: true })
        await page.goto('/')

        const menu = page.getByRole('navigation', { name: 'Navegação principal' })
        await menu.getByRole('button', { name: tela, exact: true }).click()
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

        if (process.env.CAPTURAS) {
          await page.screenshot({ path: `${process.env.CAPTURAS}/${largura}-${info.title.split(' ')[0]}.png`, fullPage: true })
        }
        const excesso = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(excesso).toBeLessThanOrEqual(0)
      })
    }
  })
}

test.describe('Formulário em janela no celular', () => {
  test.use({ viewport: { width: 390, height: 500 } })

  test('alcança o botão de salvar do cliente', async ({ page }) => {
    await simularApi(page, { logado: true })
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Clientes', exact: true }).click()
    await page.getByRole('button', { name: 'Novo Cliente' }).click()

    const salvar = page.getByRole('dialog', { name: 'Novo cliente' }).getByRole('button', { name: 'Salvar cliente' })
    await salvar.scrollIntoViewIfNeeded()
    await expect(salvar).toBeInViewport()
  })
})
