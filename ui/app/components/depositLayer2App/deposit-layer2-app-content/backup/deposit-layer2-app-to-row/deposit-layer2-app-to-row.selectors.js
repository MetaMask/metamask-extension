const selectors = {
  getToDropdownOpen,
  sendToIsInError,
}

module.exports = selectors

function getToDropdownOpen (state) {
  return state.send.toDropdownOpen
}

function sendToIsInError (state) {
    return Boolean(state.send.errors.to)
}
