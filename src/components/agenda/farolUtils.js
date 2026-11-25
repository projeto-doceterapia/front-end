export function farolConfigurado(farol) {
  return Boolean(farol?.limiteAmarelo && farol?.limiteVermelho)
}
