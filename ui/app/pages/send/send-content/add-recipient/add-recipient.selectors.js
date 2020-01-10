export function getToDropdownOpen (state) {
  return state.send.toDropdownOpen
}

export function sendToIsInError (state) {
  return Boolean(state.send.errors.to)
}

export function getTokens (state) {
  return state.metamask.tokens
}
