import { useState, useCallback } from 'react'

export const useNotification = () => {
  const [notification, setNotification] = useState({ message: '', type: 'success' })

  const showSuccess = useCallback((msg) => {
    setNotification({ message: msg, type: 'success' })
  }, [])

  const showError = useCallback((msg) => {
    setNotification({ message: msg, type: 'error' })
  }, [])

  const showWarning = useCallback((msg) => {
    setNotification({ message: msg, type: 'warning' })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification({ message: '', type: 'success' })
  }, [])

  return {
    notification,
    setNotification,
    showSuccess,
    showError,
    showWarning,
    clearNotification
  }
}
