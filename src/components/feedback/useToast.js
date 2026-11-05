import { useContext } from 'react'
import toastContext from './toastContext'

export default function useToast() {
  const toast = useContext(toastContext)
  if (!toast) throw new Error('useToast must be used within ToastProvider')
  return toast
}
