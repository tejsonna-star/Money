const listeners = new Set()

export function subscribeToasts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toast(message, type = 'success') {
  const payload = { id: Date.now() + Math.random(), message, type }
  listeners.forEach((listener) => listener(payload))
  return payload.id
}

export const toastSuccess = (message) => toast(message, 'success')
export const toastError = (message) => toast(message, 'error')
