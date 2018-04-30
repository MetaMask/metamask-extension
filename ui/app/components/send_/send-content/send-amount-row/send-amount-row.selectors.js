const selectors = {
  sendAmountIsInError,
}

module.exports = selectors

function sendAmountIsInError (state) {
  return Boolean(state.send.errors.amount)
}
