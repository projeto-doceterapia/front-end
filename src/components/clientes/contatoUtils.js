function digitosComPais(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`
}

export function linkTelefone(telefone) {
  const digitos = digitosComPais(telefone)
  return digitos ? `tel:+${digitos}` : null
}

export function linkWhatsApp(telefone) {
  const digitos = digitosComPais(telefone)
  return digitos ? `https://wa.me/${digitos}` : null
}
