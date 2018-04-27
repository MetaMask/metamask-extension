import { getSendErrors } from '../send.selectors'

const selectors = {
  isSendFormInError,
}

module.exports = selectors

function isSendFormInError (state) {
  const { amount, to } = getSendErrors(state)
  return Boolean(amount || to !== null)
}
