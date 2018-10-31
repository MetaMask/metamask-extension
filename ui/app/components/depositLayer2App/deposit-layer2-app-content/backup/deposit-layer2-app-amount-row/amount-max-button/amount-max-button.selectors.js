const selectors = {
  getMaxModeOn,
}

module.exports = selectors

function getMaxModeOn (state) {
  return state.metamask.send.maxModeOn
}
