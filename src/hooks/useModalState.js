import { useState, useCallback } from 'react'
import { DEFAULT_MODALS } from '../constants/appConstants'

export const useModalState = () => {
  const [modals, setModals] = useState(DEFAULT_MODALS)
  const [selectedEmpId, setSelectedEmpId] = useState(null)
  const [confirmationAction, setConfirmationAction] = useState(null)

  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }, [])

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }, [])

  const closeMultipleModals = useCallback((modalNames) => {
    setModals(prev => {
      const updated = { ...prev }
      modalNames.forEach(name => updated[name] = false)
      return updated
    })
  }, [])

  const triggerConfirmation = useCallback((action) => {
    setConfirmationAction(() => action)
    openModal('confirmation')
  }, [openModal])

  const confirmAction = useCallback(() => {
    if (confirmationAction) confirmationAction()
  }, [confirmationAction])

  return {
    modals,
    setModals,
    selectedEmpId,
    setSelectedEmpId,
    confirmationAction,
    setConfirmationAction,
    openModal,
    closeModal,
    closeMultipleModals,
    triggerConfirmation,
    confirmAction
  }
}
