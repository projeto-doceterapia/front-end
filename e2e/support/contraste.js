// Computes WCAG contrast for every visible text in the page, since no axe dependency is available.
export async function textosSemContraste(page) {
  return page.evaluate(() => {
    function rgba(valor) {
      const numeros = valor.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
      return { r: numeros[0], g: numeros[1], b: numeros[2], a: numeros.length > 3 ? numeros[3] : 1 }
    }
    function misturar(frente, fundo) {
      const a = frente.a
      return { r: frente.r * a + fundo.r * (1 - a), g: frente.g * a + fundo.g * (1 - a), b: frente.b * a + fundo.b * (1 - a), a: 1 }
    }
    function luminancia({ r, g, b }) {
      const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
    }
    function fundoDe(elemento) {
      const camadas = []
      for (let atual = elemento; atual; atual = atual.parentElement) {
        const estilo = getComputedStyle(atual)
        if (estilo.backgroundImage !== 'none') return null
        const cor = rgba(estilo.backgroundColor)
        if (cor.a > 0) camadas.push(cor)
        if (cor.a >= 1) break
      }
      return camadas.reverse().reduce((fundo, camada) => misturar(camada, fundo), { r: 255, g: 255, b: 255, a: 1 })
    }
    const falhas = []
    const caminhante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (caminhante.nextNode()) {
      const texto = caminhante.currentNode.textContent.trim()
      const elemento = caminhante.currentNode.parentElement
      if (!texto || !elemento || elemento.closest('[aria-hidden="true"], svg, option')) continue
      const estilo = getComputedStyle(elemento)
      const caixa = elemento.getBoundingClientRect()
      if (estilo.visibility === 'hidden' || Number(estilo.opacity) === 0 || caixa.width < 2 || caixa.height < 2) continue
      if (elemento.closest(':disabled, [aria-disabled="true"], .sr-only, .stock-sr-only, .sidebar-rotulo')) continue
      const fundo = fundoDe(elemento)
      if (!fundo) continue
      const cor = misturar(rgba(estilo.color), fundo)
      const [claro, escuro] = [luminancia(cor), luminancia(fundo)].sort((a, b) => b - a)
      const razao = (claro + 0.05) / (escuro + 0.05)
      const tamanho = parseFloat(estilo.fontSize)
      const grande = tamanho >= 24 || (tamanho >= 18.66 && Number(estilo.fontWeight) >= 700)
      if (razao < (grande ? 3 : 4.5)) falhas.push(`${texto.slice(0, 40)} (${razao.toFixed(2)}, ${estilo.color} em ${elemento.className})`)
    }
    return [...new Set(falhas)]
  })
}
