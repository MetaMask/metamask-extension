export function sendAmountIsInError (state) {
  return Boolean(state.send.errors.amount)
}
