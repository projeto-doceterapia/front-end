const API = 'http://localhost:8080'

const USUARIO_DE_TESTE = { id: 1, nome: 'Usuária de Teste', email: 'teste@example.com' }

// Answers every API call in the browser so the e2e suite never needs the back-end or real data.
export async function simularApi(page, { logado = false, loginValido = true } = {}) {
  let sessaoAtiva = logado

  await page.route(`${API}/**`, (rota) => {
    const { pathname } = new URL(rota.request().url())

    if (pathname === '/usuarios/me') {
      return sessaoAtiva
        ? rota.fulfill({ status: 200, json: USUARIO_DE_TESTE })
        : rota.fulfill({ status: 401, json: {} })
    }
    if (pathname === '/usuarios/login') {
      sessaoAtiva = loginValido
      return rota.fulfill({ status: loginValido ? 200 : 401, json: {} })
    }
    if (pathname === '/usuarios/logout') {
      sessaoAtiva = false
      return rota.fulfill({ status: 204 })
    }
    return rota.fulfill({ status: 200, json: [] })
  })
}
