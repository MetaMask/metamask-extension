export function getCustomStorageErrors (state) {
  return state.storageLimit.errors
}

export function getCustomStorageLimit (state) {
  return state.storageLimit.customData.limit
}

export function getCustomStorageTotal (state) {
  return state.storageLimit.customData.total
}
