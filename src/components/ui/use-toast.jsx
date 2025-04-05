// Simple toast hook implementation
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

export default function useToast() {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback(({ title, description, action, ...props }) => {
    setToasts((currentToasts) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = {
        id,
        title,
        description,
        action,
        ...props,
      }
      return [newToast, ...currentToasts].slice(0, TOAST_LIMIT)
    })
  }, [])

  const dismiss = React.useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    )
  }, [])

  React.useEffect(() => {
    const timeouts = new Map()

    toasts.forEach((toast) => {
      if (!timeouts.has(toast.id)) {
        timeouts.set(
          toast.id,
          setTimeout(() => {
            dismiss(toast.id)
            timeouts.delete(toast.id)
          }, TOAST_REMOVE_DELAY)
        )
      }
    })

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [toasts, dismiss])

  return {
    toasts,
    toast,
    dismiss,
  }
}