import { expect, test } from '@playwright/test'
import { simularApi } from './support/apiFalsa'

test.describe('Login', () => {
  test('mostra a tela de login quando não há sessão', async ({ page }) => {
    await simularApi(page)
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Bem-vinda de volta/ })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
  })

  test('pede e-mail e senha quando o formulário está vazio', async ({ page }) => {
    await simularApi(page)
    await page.goto('/')

    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.locator('.form-error')).toHaveText('Preencha e-mail e senha para continuar.')
  })

  test('avisa quando as credenciais são inválidas', async ({ page }) => {
    await simularApi(page, { loginValido: false })
    await page.goto('/')

    await page.getByLabel('E-mail').fill('teste@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.getByText('E-mail ou senha inválidos. Tente novamente.')).toBeVisible()
  })

  test('entra no sistema com credenciais válidas', async ({ page }) => {
    await simularApi(page)
    await page.goto('/')

    await page.getByLabel('E-mail').fill('teste@example.com')
    await page.getByLabel('Senha', { exact: true }).fill('senha-de-teste')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.getByLabel('E-mail')).toBeHidden()
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })
})
