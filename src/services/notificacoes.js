import api from './api'

const CAMINHO_STREAM = '/notificacoes/stream'

export function listarNaoLidas() {
  return api.get('/notificacoes/nao-lidas').then((resposta) => resposta.data || [])
}

export function marcarComoLida(id) {
  return api.patch(`/notificacoes/${id}/marcar-lida`).then((resposta) => resposta.data)
}

function urlStream() {
  const base = (api.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}${CAMINHO_STREAM}`
}

// Approved exception to the axios-only rule: axios cannot consume a
// server-sent stream, so the live feed uses EventSource. It shares the same
// base URL and cookie auth as api.js.
export function assinarStream({ aoNotificar, aoMarcarLida, aoReconectar }) {
  const fonte = new EventSource(urlStream(), { withCredentials: true })
  let conectado = false

  fonte.addEventListener('open', () => {
    // On the first open there is nothing to reload; later opens follow a drop,
    // so the caller reloads the list to recover notifications missed offline.
    if (conectado && aoReconectar) {
      aoReconectar()
    }
    conectado = true
  })

  fonte.addEventListener('notificacao', (evento) => {
    if (!aoNotificar) return
    try {
      aoNotificar(JSON.parse(evento.data))
    } catch {
      // A single malformed event is dropped: a full reload here could loop if
      // the stream keeps sending unparsable data.
    }
  })

  fonte.addEventListener('lida', (evento) => {
    if (!aoMarcarLida) return
    try {
      aoMarcarLida(JSON.parse(evento.data).id)
    } catch {
      // A single malformed event is dropped: a full reload here could loop if
      // the stream keeps sending unparsable data.
    }
  })

  return () => fonte.close()
}
