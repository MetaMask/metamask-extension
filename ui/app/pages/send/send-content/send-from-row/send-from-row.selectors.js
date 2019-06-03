const selectors = {
  getFromDropdownOpen,
}

module.exports = selectors

function getFromDropdownOpen (state) {
  return state.send.fromDropdownOpen
}
