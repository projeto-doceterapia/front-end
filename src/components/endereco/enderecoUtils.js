export function somenteDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '')
}

export function formatarCep(digitos) {
  const limpos = somenteDigitos(digitos).slice(0, 8)
  return limpos.length > 5 ? `${limpos.slice(0, 5)}-${limpos.slice(5)}` : limpos
}

export function montarEndereco({ rua, bairro, cidade, uf }) {
  const local = [rua, bairro, cidade].filter(Boolean).join(', ')
  if (!uf) return local
  return local ? `${local} - ${uf}` : uf
}
