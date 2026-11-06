import { render } from '@testing-library/react'
import ToastProvider from '../components/feedback/ToastProvider'

export default function renderComToast(elemento, opcoes) {
  return render(elemento, { wrapper: ToastProvider, ...opcoes })
}
