export function dataLonga(data) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(data)
}

export function dataCurta(data) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(data)
    .replace(' de ', ' ')
}
