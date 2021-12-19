let currentInstance = null

export function getCurrentInstance() {
  return currentInstance
}
export function setCurrentInstance(instance) {
  currentInstance = instance
}
