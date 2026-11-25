const DESTAQUE_HOJE = {
  ESPERANDO_FAZER: 'Começar hoje',
  EM_PRODUCAO: 'Finalizar hoje',
  AGUARDANDO_ENTREGA: 'Entregar hoje',
}

export function destaquePrazo(status, dias) {
  return dias === 0 ? DESTAQUE_HOJE[status] ?? null : null
}
