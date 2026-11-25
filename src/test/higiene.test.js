import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const fontes = import.meta.glob(['/src/**/*.{js,jsx}', '!/src/test/higiene.test.js'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
const arquivos = import.meta.glob('/src/**/*')

const MOCKS_REMOVIDOS = [
  '/src/services/dadosTeste.js',
  '/src/components/agenda/dadosAgenda.jsx',
  '/src/components/pedido/dadosPedido.jsx',
]

function lerNaRaiz(nome) {
  return readFileSync(resolve(process.cwd(), nome), 'utf-8')
}

describe('higiene do código', () => {
  it('não mantém os mocks removidos nem importações deles', () => {
    for (const caminho of MOCKS_REMOVIDOS) {
      expect(arquivos).not.toHaveProperty(caminho)
    }
    for (const [caminho, conteudo] of Object.entries(fontes)) {
      expect(conteudo, caminho).not.toMatch(/dadosTeste|dadosAgenda|dadosPedido/)
    }
  })

  it('mantém o filtro da visão geral', () => {
    expect(arquivos).toHaveProperty('/src/components/visao-geral/Filtros.jsx')
  })

  it('documento em pt-BR', () => {
    const html = lerNaRaiz('index.html')

    expect(html).toMatch(/<html lang="pt-BR">/)
    expect(html).toMatch(/<title>Doceterapia<\/title>/)
  })

  it('versões exatas', () => {
    const pacote = JSON.parse(lerNaRaiz('package.json'))
    const versoes = { ...pacote.dependencies, ...pacote.devDependencies }

    for (const [nome, versao] of Object.entries(versoes)) {
      expect(versao, nome).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })
})
